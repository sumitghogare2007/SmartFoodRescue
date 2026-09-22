import { Server as SocketIOServer, Socket } from 'socket.io';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import Pickup from '../models/Pickup';
import Volunteer from '../models/Volunteer';
import NGO from '../models/NGO';
import Donor from '../models/Donor';
import PickupLiveLocation from '../models/PickupLiveLocation';
import PickupLocationHistory from '../models/PickupLocationHistory';
import { haversineDistanceMeters } from './routingService';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: IUser;
  };
}

export interface LocationPayload {
  pickupId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: number | string;
}

export interface VerificationResult {
  authorized: boolean;
  isVolunteer: boolean;
  volunteerId?: mongoose.Types.ObjectId;
  pickup?: any;
  reason?: string;
}

export async function verifyPickupAccess(user: IUser, pickupId: string): Promise<VerificationResult> {
  if (!mongoose.Types.ObjectId.isValid(pickupId)) {
    return { authorized: false, isVolunteer: false, reason: 'Invalid pickup ID format' };
  }

  const pickup = await Pickup.findById(pickupId)
    .populate({
      path: 'requestId',
      populate: [
        { path: 'donationId', populate: 'donorId' },
        { path: 'ngoId' }
      ]
    })
    .populate('volunteerId');

  if (!pickup) {
    return { authorized: false, isVolunteer: false, reason: 'Pickup not found' };
  }

  // 1. Admin is always authorized
  if (user.userType === 'ADMIN') {
    return { authorized: true, isVolunteer: true, pickup };
  }

  const userIdStr = user._id.toString();

  // 2. Assigned Volunteer check
  if (user.userType === 'VOLUNTEER') {
    const volProfile = await Volunteer.findOne({ userId: user._id });
    if (volProfile && pickup.volunteerId) {
      const assignedVolId = (pickup.volunteerId as any)._id
        ? (pickup.volunteerId as any)._id.toString()
        : pickup.volunteerId.toString();
      if (assignedVolId === volProfile._id.toString()) {
        return {
          authorized: true,
          isVolunteer: true,
          volunteerId: volProfile._id,
          pickup
        };
      }
    }
  }

  // 3. Assigned NGO check
  if (user.userType === 'NGO') {
    const ngoProfile = await NGO.findOne({ userId: user._id });
    const reqNgo = (pickup.requestId as any)?.ngoId;
    if (ngoProfile && reqNgo) {
      const ngoId = reqNgo._id ? reqNgo._id.toString() : reqNgo.toString();
      if (ngoId === ngoProfile._id.toString()) {
        return { authorized: true, isVolunteer: false, pickup };
      }
    }
  }

  // 4. Assigned Donor check
  if (user.userType === 'DONOR') {
    const donorProfile = await Donor.findOne({ userId: user._id });
    const reqDonation = (pickup.requestId as any)?.donationId;
    const donDonor = reqDonation?.donorId;
    if (donorProfile && donDonor) {
      const donorId = donDonor._id ? donDonor._id.toString() : donDonor.toString();
      if (donorId === donorProfile._id.toString()) {
        return { authorized: true, isVolunteer: false, pickup };
      }
    }
  }

  return { authorized: false, isVolunteer: false, reason: 'User not authorized for this pickup tracking' };
}

class TrackingSocketService {
  private io: SocketIOServer | null = null;
  // In-memory record to throttle history writes per pickup: pickupId -> { lastLat, lastLng, lastTime }
  private lastHistoryWrite: Map<string, { lat: number; lng: number; time: number }> = new Map();

  public init(io: SocketIOServer) {
    this.io = io;

    // Socket Authentication Middleware using JWT
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          (socket.handshake.headers?.authorization
            ? socket.handshake.headers.authorization.replace('Bearer ', '')
            : null);

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const user = await User.findById(decoded.id).select('-passwordHash');

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.data.user = user;
        next();
      } catch (err) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const user = socket.data.user;

      // Join pickup tracking room
      socket.on('join:pickup', async ({ pickupId }: { pickupId: string }) => {
        if (!user) {
          socket.emit('tracking:error', { message: 'Not authenticated' });
          return;
        }

        const verification = await verifyPickupAccess(user, pickupId);
        if (!verification.authorized) {
          socket.emit('tracking:error', {
            pickupId,
            message: verification.reason || 'Forbidden: You do not have access to track this pickup'
          });
          return;
        }

        const roomName = `pickup:${pickupId}`;
        socket.join(roomName);

        // Fetch latest known live location and emit to this subscriber
        const latestLocation = await PickupLiveLocation.findOne({ pickupId }).lean();
        socket.emit('tracking:joined', {
          pickupId,
          room: roomName,
          latestLocation: latestLocation || null,
          pickupStatus: verification.pickup?.pickupStatus
        });
      });

      // Leave pickup tracking room
      socket.on('leave:pickup', ({ pickupId }: { pickupId: string }) => {
        socket.leave(`pickup:${pickupId}`);
        socket.emit('tracking:left', { pickupId });
      });

      // Volunteer emits real location update
      socket.on('location:update', async (payload: LocationPayload) => {
        if (!user) {
          socket.emit('tracking:error', { message: 'Not authenticated' });
          return;
        }

        const { pickupId, latitude, longitude, accuracy, speed, heading, timestamp } = payload;

        // 1. Strict Coordinate Boundary Validation
        if (
          typeof latitude !== 'number' ||
          typeof longitude !== 'number' ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180 ||
          isNaN(latitude) ||
          isNaN(longitude)
        ) {
          socket.emit('tracking:error', {
            pickupId,
            message: 'Invalid GPS coordinates. Latitude [-90, 90], Longitude [-180, 180].'
          });
          return;
        }

        // 2. Authorization Check: Only assigned volunteer or admin can update location
        const verification = await verifyPickupAccess(user, pickupId);
        if (!verification.authorized || !verification.isVolunteer) {
          socket.emit('tracking:error', {
            pickupId,
            message: 'Unauthorized: Only the assigned volunteer can submit GPS updates for this pickup.'
          });
          return;
        }

        const volunteerId = verification.volunteerId || (verification.pickup?.volunteerId as any)?._id;
        const locationTime = timestamp ? new Date(timestamp) : new Date();

        try {
          // 3. Upsert single PickupLiveLocation document
          let activeLive = await PickupLiveLocation.findOne({ pickupId });
          const trackingSessionId =
            activeLive?.trackingSessionId || `session_${pickupId}_${Date.now()}`;

          activeLive = await PickupLiveLocation.findOneAndUpdate(
            { pickupId },
            {
              $set: {
                trackingSessionId,
                volunteerId,
                latitude,
                longitude,
                accuracy: accuracy ?? 0,
                speed: speed ?? 0,
                heading: heading ?? 0,
                status: 'ACTIVE',
                updatedAt: locationTime
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          // 4. Throttled History Breadcrumb recording (e.g. at least 15s or 25m movement)
          const lastWrite = this.lastHistoryWrite.get(pickupId);
          const nowMs = Date.now();
          let shouldRecordHistory = false;

          if (!lastWrite) {
            shouldRecordHistory = true;
          } else {
            const timeDiff = nowMs - lastWrite.time;
            const distDiff = haversineDistanceMeters(lastWrite.lat, lastWrite.lng, latitude, longitude);
            if (timeDiff >= 15000 || distDiff >= 25) {
              shouldRecordHistory = true;
            }
          }

          if (shouldRecordHistory) {
            this.lastHistoryWrite.set(pickupId, { lat: latitude, lng: longitude, time: nowMs });
            // Save history record asynchronously
            PickupLocationHistory.create({
              pickupId,
              trackingSessionId,
              volunteerId,
              latitude,
              longitude,
              accuracy,
              speed,
              heading,
              timestamp: locationTime
            }).catch((err) => {
              console.warn('[TrackingSocket] Failed to write location history breadcrumb:', err.message);
            });
          }

          // 5. Broadcast in real time ONLY to the authorized pickup room
          const broadcastPayload = {
            pickupId,
            trackingSessionId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            status: 'ACTIVE',
            timestamp: locationTime.toISOString()
          };

          this.io?.to(`pickup:${pickupId}`).emit('volunteer:location', broadcastPayload);
        } catch (dbError: any) {
          console.error('[TrackingSocket] Failed to persist live location:', dbError);
          socket.emit('tracking:error', { pickupId, message: 'Failed to record location update' });
        }
      });

      socket.on('disconnect', () => {
        // Socket disconnected
      });
    });
  }

  /**
   * Programmatically broadcast live tracking events (e.g. status changes, start, stop)
   */
  public emitToPickupRoom(pickupId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`pickup:${pickupId}`).emit(event, data);
    }
  }

  public getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const trackingSocketService = new TrackingSocketService();
