import { Request, Response, NextFunction } from 'express';
import Pickup from '../models/Pickup';
import PickupTracking from '../models/PickupTracking';
import PickupLiveLocation from '../models/PickupLiveLocation';
import PickupLocationHistory from '../models/PickupLocationHistory';
import { verifyPickupAccess } from '../services/trackingSocketService';
import { routingService } from '../services/routingService';
import { eventService } from '../services/eventService';
import { trackingSocketService } from '../services/trackingSocketService';

export const startTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pickupId } = req.params;
    const user = req.user;

    const access = await verifyPickupAccess(user, pickupId);
    if (!access.authorized || !access.isVolunteer) {
      return res.status(403).json({
        message: 'Unauthorized: Only the assigned volunteer can start live tracking.'
      });
    }

    const pickup = access.pickup;
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }

    // Strict state transition check: DISPATCHED -> EN_ROUTE
    if (pickup.pickupStatus !== 'DISPATCHED') {
      return res.status(400).json({
        message: `Cannot start tracking. Current status is ${pickup.pickupStatus}. Expected: DISPATCHED.`
      });
    }

    const trackingSessionId = `sess_${pickup._id}_${Date.now()}`;
    const volunteerId = access.volunteerId || (pickup.volunteerId as any)?._id || pickup.volunteerId;

    // Update pickup status to EN_ROUTE
    pickup.pickupStatus = 'EN_ROUTE';
    const historyEntry = {
      status: 'EN_ROUTE',
      changedBy: user._id,
      changedAt: new Date(),
      note: 'Live GPS tracking and delivery navigation started'
    };
    pickup.statusHistory.push(historyEntry);
    await pickup.save();

    // Log to pickupTracking audit collection
    await PickupTracking.create({
      pickupId: pickup._id,
      status: 'EN_ROUTE',
      changedBy: user._id,
      changedAt: new Date(),
      note: 'Live GPS tracking and delivery navigation started'
    });

    // Initialize or update PickupLiveLocation with new trackingSessionId
    const initialLat = req.body.latitude;
    const initialLng = req.body.longitude;
    const hasInitialCoords = typeof initialLat === 'number' && typeof initialLng === 'number';

    const liveRecord = await PickupLiveLocation.findOneAndUpdate(
      { pickupId: pickup._id },
      {
        $set: {
          trackingSessionId,
          volunteerId,
          status: 'ACTIVE',
          updatedAt: new Date(),
          ...(hasInitialCoords
            ? {
                latitude: initialLat,
                longitude: initialLng,
                accuracy: req.body.accuracy ?? 0,
                speed: req.body.speed ?? 0,
                heading: req.body.heading ?? 0
              }
            : {})
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Broadcast through Socket.IO and SSE
    trackingSocketService.emitToPickupRoom(pickupId, 'tracking:started', {
      pickupId,
      trackingSessionId,
      status: 'EN_ROUTE',
      startedAt: new Date().toISOString()
    });

    eventService.broadcast('pickup:updated', { pickupId: pickup._id, status: 'EN_ROUTE' });

    res.json({
      success: true,
      message: 'Live tracking session started',
      trackingSessionId,
      status: 'EN_ROUTE',
      liveLocation: liveRecord
    });
  } catch (error) {
    next(error);
  }
};

export const stopTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pickupId } = req.params;
    const user = req.user;

    const access = await verifyPickupAccess(user, pickupId);
    if (!access.authorized || !access.isVolunteer) {
      return res.status(403).json({
        message: 'Unauthorized: Only the assigned volunteer can stop live tracking.'
      });
    }

    const pickup = access.pickup;
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }

    // Strict state transition check: EN_ROUTE -> ARRIVED
    if (pickup.pickupStatus !== 'EN_ROUTE') {
      return res.status(400).json({
        message: `Cannot arrive. Current status is ${pickup.pickupStatus}. Expected: EN_ROUTE.`
      });
    }

    // Update pickup status to ARRIVED
    pickup.pickupStatus = 'ARRIVED';
    const historyEntry = {
      status: 'ARRIVED',
      changedBy: user._id,
      changedAt: new Date(),
      note: 'Volunteer reached destination. Live GPS tracking stopped.'
    };
    pickup.statusHistory.push(historyEntry);
    await pickup.save();

    // Log to audit collection
    await PickupTracking.create({
      pickupId: pickup._id,
      status: 'ARRIVED',
      changedBy: user._id,
      changedAt: new Date(),
      note: 'Volunteer reached destination. Live GPS tracking stopped.'
    });

    // Update PickupLiveLocation to ARRIVED (preserve last known location)
    await PickupLiveLocation.findOneAndUpdate(
      { pickupId: pickup._id },
      {
        $set: {
          status: 'ARRIVED',
          updatedAt: new Date()
        }
      }
    );

    // Broadcast through Socket.IO and SSE
    trackingSocketService.emitToPickupRoom(pickupId, 'tracking:stopped', {
      pickupId,
      status: 'ARRIVED',
      arrivedAt: new Date().toISOString()
    });

    eventService.broadcast('pickup:updated', { pickupId: pickup._id, status: 'ARRIVED' });

    res.json({
      success: true,
      message: 'Volunteer arrived at destination. Live tracking stopped.',
      status: 'ARRIVED'
    });
  } catch (error) {
    next(error);
  }
};

export const getLiveTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pickupId } = req.params;
    const user = req.user;

    const access = await verifyPickupAccess(user, pickupId);
    if (!access.authorized) {
      return res.status(403).json({
        message: access.reason || 'Unauthorized to view tracking for this pickup'
      });
    }

    const pickup = await Pickup.findById(pickupId)
      .populate({
        path: 'requestId',
        populate: [
          {
            path: 'donationId',
            populate: [
              { path: 'donorId', populate: 'userId' },
              { path: 'locationId' }
            ]
          },
          {
            path: 'ngoId',
            populate: ['userId', 'locationId']
          }
        ]
      })
      .populate({
        path: 'volunteerId',
        populate: { path: 'userId', select: 'name phone email' }
      })
      .lean();

    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

    const liveLocation = await PickupLiveLocation.findOne({ pickupId: pickup._id }).lean();

    const reqObj = pickup.requestId as any;
    const donation = reqObj?.donationId as any;
    const donor = donation?.donorId as any;
    const donorLoc = donation?.locationId || donor?.locationId;
    const ngo = reqObj?.ngoId as any;
    const ngoLoc = ngo?.locationId as any;
    const volunteer = pickup.volunteerId as any;

    res.json({
      pickupId: pickup._id,
      pickupStatus: pickup.pickupStatus,
      trackingSessionId: liveRecordOrDefault(liveLocation)?.trackingSessionId || null,
      liveLocation: liveLocation || null,
      donor: {
        name: donor?.organizationName || donor?.contactName || donor?.userId?.name || 'Food Donor',
        phone: donor?.contactPhone || donor?.userId?.phone,
        location: donorLoc
          ? {
              address: donorLoc.address,
              area: donorLoc.area,
              city: donorLoc.city,
              latitude: donorLoc.latitude,
              longitude: donorLoc.longitude
            }
          : null
      },
      destinationNgo: {
        name: ngo?.ngoName || 'NGO Partner',
        phone: ngo?.contactNo || ngo?.userId?.phone,
        location: ngoLoc
          ? {
              address: ngoLoc.address,
              area: ngoLoc.area,
              city: ngoLoc.city,
              latitude: ngoLoc.latitude,
              longitude: ngoLoc.longitude
            }
          : null
      },
      volunteer: volunteer
        ? {
            id: volunteer._id,
            name: volunteer.userId?.name || 'Assigned Volunteer',
            phone: volunteer.userId?.phone,
            vehicleType: volunteer.vehicleType || 'Vehicle'
          }
        : null
    });
  } catch (error) {
    next(error);
  }
};

function liveRecordOrDefault(record: any) {
  return record;
}

export const getPickupRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pickupId } = req.params;
    const user = req.user;

    const access = await verifyPickupAccess(user, pickupId);
    if (!access.authorized) {
      return res.status(403).json({ message: 'Unauthorized to view route for this pickup' });
    }

    const pickup = await Pickup.findById(pickupId).populate({
      path: 'requestId',
      populate: [
        { path: 'donationId', populate: 'locationId' },
        { path: 'ngoId', populate: 'locationId' }
      ]
    });

    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

    const reqObj = pickup.requestId as any;
    const donation = reqObj?.donationId as any;
    const donorLoc = donation?.locationId as any;
    const ngoLoc = reqObj?.ngoId?.locationId as any;

    const destLat = ngoLoc?.latitude || 19.076;
    const destLng = ngoLoc?.longitude || 72.8777;

    // Origin: provided by query, or from PickupLiveLocation, or from donor location
    let originLat = Number(req.query.lat);
    let originLng = Number(req.query.lng);

    if (isNaN(originLat) || isNaN(originLng)) {
      const live = await PickupLiveLocation.findOne({ pickupId: pickup._id });
      if (live && typeof live.latitude === 'number' && typeof live.longitude === 'number') {
        originLat = live.latitude;
        originLng = live.longitude;
      } else {
        originLat = donorLoc?.latitude || 19.1197;
        originLng = donorLoc?.longitude || 72.8464;
      }
    }

    const routeResult = await routingService.computeRoute(
      { latitude: originLat, longitude: originLng },
      { latitude: destLat, longitude: destLng },
      req.query.force === 'true'
    );

    res.json(routeResult);
  } catch (error) {
    next(error);
  }
};

export const updateLocationHttp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pickupId } = req.params;
    const user = req.user;
    const { latitude, longitude, accuracy, speed, heading, timestamp } = req.body;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({ message: 'Invalid latitude or longitude coordinates' });
    }

    const access = await verifyPickupAccess(user, pickupId);
    if (!access.authorized || !access.isVolunteer) {
      return res.status(403).json({ message: 'Unauthorized to update location' });
    }

    const volunteerId = access.volunteerId || (access.pickup?.volunteerId as any)?._id;
    const locationTime = timestamp ? new Date(timestamp) : new Date();

    let activeLive = await PickupLiveLocation.findOne({ pickupId });
    const trackingSessionId = activeLive?.trackingSessionId || `session_${pickupId}_${Date.now()}`;

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

    // Broadcast to room
    trackingSocketService.emitToPickupRoom(pickupId, 'volunteer:location', {
      pickupId,
      trackingSessionId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      status: 'ACTIVE',
      timestamp: locationTime.toISOString()
    });

    res.json({ success: true, liveLocation: activeLive });
  } catch (error) {
    next(error);
  }
};
