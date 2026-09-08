import { Request, Response, NextFunction } from 'express';
import Pickup from '../models/Pickup';
import PickupTracking from '../models/PickupTracking';
import DonationRequest from '../models/DonationRequest';
import FoodDonation from '../models/FoodDonation';
import Distribution from '../models/Distribution';
import Volunteer from '../models/Volunteer';
import NGO from '../models/NGO';
import { sendDeliveredEmail, sendVolunteerStatusEmail } from '../services/emailService';
import { eventService } from '../services/eventService';

// Mask aadhaar helper: XXXX-XXXX-1234
const maskAadhaar = (aadhaar?: string): string | undefined => {
  if (!aadhaar) return undefined;
  const parts = aadhaar.split('-');
  if (parts.length === 3) {
    return `XXXX-XXXX-${parts[2]}`;
  }
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { volunteerId, ngoId, status } = req.query;
    const filter: any = {};

    if (volunteerId === 'me' && req.user) {
      const vol = await Volunteer.findOne({ userId: req.user._id });
      if (!vol) return res.json([]);
      filter.volunteerId = vol._id;
    } else if (volunteerId) {
      filter.volunteerId = volunteerId;
    }

    if (ngoId === 'me' && req.user) {
      const ngo = await NGO.findOne({ userId: req.user._id });
      if (ngo) {
        const requests = await DonationRequest.find({ ngoId: ngo._id }).select('_id');
        filter.requestId = { $in: requests.map(r => r._id) };
      }
    }

    if (status) filter.pickupStatus = status;

    const pickups = await Pickup.find(filter)
      .populate({
        path: 'requestId',
        populate: [
          {
            path: 'donationId',
            populate: [
              { path: 'donorId', populate: ['userId', 'locationId'] },
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
      .sort({ createdAt: -1 })
      .lean();

    // Attach distribution info for each pickup
    const pickupIds = pickups.map(p => p._id);
    const distributions = await Distribution.find({ pickupId: { $in: pickupIds } }).lean();
    const distMap = new Map(distributions.map(d => [d.pickupId.toString(), d]));

    const enrichedPickups = pickups.map(p => {
      const dist = distMap.get(p._id.toString()) || null;
      // Mask donation aadhaar if present
      if (p.requestId && (p.requestId as any).donationId) {
        const d = (p.requestId as any).donationId;
        if (d.aadhaarId) {
          d.maskedAadhaar = maskAadhaar(d.aadhaarId);
          d.aadhaarId = maskAadhaar(d.aadhaarId);
        }
      }
      return {
        ...p,
        distribution: dist
      };
    });

    res.json(enrichedPickups);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate({
        path: 'requestId',
        populate: [
          {
            path: 'donationId',
            populate: [
              { path: 'donorId', populate: ['userId', 'locationId'] },
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

    const dist = await Distribution.findOne({ pickupId: pickup._id }).lean();
    if (pickup.requestId && (pickup.requestId as any).donationId) {
      const d = (pickup.requestId as any).donationId;
      if (d.aadhaarId) {
        d.maskedAadhaar = maskAadhaar(d.aadhaarId);
        d.aadhaarId = maskAadhaar(d.aadhaarId);
      }
    }

    res.json({
      ...pickup,
      distribution: dist || null
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, note } = req.body;
    const pickup = await Pickup.findById(req.params.id).populate('requestId');
    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

    // Valid state transitions
    const validTransitions: Record<string, string[]> = {
      'ASSIGNED': ['RECEIVED'],
      'RECEIVED': ['DISPATCHED'],
      'DISPATCHED': ['DELIVERED'],
      'DELIVERED': ['DISTRIBUTED'],
      'DISTRIBUTED': []
    };

    const allowedNext = validTransitions[pickup.pickupStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from ${pickup.pickupStatus} to ${status}. Expected: ${allowedNext.join(' or ') || 'None (Completed)'}`
      });
    }

    pickup.pickupStatus = status;
    const historyEntry = {
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || `Status advanced to ${status}`
    };
    pickup.statusHistory.push(historyEntry);
    await pickup.save();

    // Create record in dedicated pickupTracking collection
    const tracking = new PickupTracking({
      pickupId: pickup._id,
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || `Status advanced to ${status}`
    });
    await tracking.save();

    // Cascade to FoodDonation
    const request = await DonationRequest.findById(pickup.requestId);
    if (request) {
      const donation = await FoodDonation.findById(request.donationId);
      if (donation) {
        if (status === 'RECEIVED') donation.status = 'RECEIVED';
        else if (status === 'DISPATCHED') donation.status = 'DISPATCHED';
        else if (status === 'DELIVERED') {
          donation.status = 'DELIVERED';
          // Ensure Distribution record exists
          const existingDist = await Distribution.findOne({ pickupId: pickup._id });
          if (!existingDist) {
            const distribution = new Distribution({
              pickupId: pickup._id,
              ngoId: request.ngoId,
              distributionStatus: 'PENDING'
            });
            await distribution.save();
          }
        } else if (status === 'DISTRIBUTED') {
          donation.status = 'DISTRIBUTED';
        }
        await donation.save();
      }
    }

    // Trigger email notification for status changes to donor's registered email (asynchronous, non-blocking)
    (async () => {
      try {
        const fullPickup = await Pickup.findById(pickup._id)
          .populate({
            path: 'requestId',
            populate: [
              {
                path: 'donationId',
                populate: [
                  { path: 'donorId', populate: ['userId', 'locationId'] },
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
            populate: { path: 'userId' }
          });

        const reqObj = fullPickup?.requestId as any;
        const don = reqObj?.donationId as any;
        const donor = don?.donorId as any;
        const ngo = reqObj?.ngoId as any;
        const vol = fullPickup?.volunteerId as any;

        const donorEmail = donor?.userId?.email || donor?.contactEmail;
        const ngoEmail = ngo?.contactEmail || ngo?.userId?.email;
        const volEmail = vol?.userId?.email;

        if (donorEmail && don) {
          const donorLoc = don.locationId as any || donor?.locationId as any;
          const ngoLoc = ngo?.locationId as any;
          const pickupLocStr = donorLoc ? `${donorLoc.address}, ${donorLoc.area}, ${donorLoc.city}` : 'Donor Address';
          const ngoLocStr = ngoLoc ? `${ngoLoc.address}, ${ngoLoc.area}, ${ngoLoc.city}` : 'NGO Center';

          await sendVolunteerStatusEmail({
            to: donorEmail,
            donorName: donor?.organizationName || donor?.contactName || donor?.userId?.name || 'Food Donor',
            donationId: don._id.toString(),
            foodType: don.foodType || 'Surplus Food',
            quantity: don.quantity || reqObj?.requestedQuantity || 0,
            unit: don.unit || 'portions',
            ngoName: ngo?.ngoName || ngo?.userId?.name || 'NGO Partner',
            volunteerName: vol?.userId?.name || 'Fleet Volunteer',
            volunteerPhone: vol?.userId?.phone,
            status,
            pickupLocation: pickupLocStr,
            deliveryLocation: ngoLocStr,
            notes: note
          });
        }

        if (status === 'DELIVERED') {
          if (donorEmail && don) {
            const donorLoc = don.locationId as any || donor?.locationId as any;
            const ngoLoc = ngo?.locationId as any;
            const pickupLocStr = donorLoc ? `${donorLoc.address}, ${donorLoc.area}, ${donorLoc.city}` : 'Donor Address';
            const ngoLocStr = ngoLoc ? `${ngoLoc.address}, ${ngoLoc.area}, ${ngoLoc.city}` : 'NGO Center';

            const donorDisplayName = donor?.userId?.name || donor?.contactName || donor?.organizationName || 'Food Donor';

            // Send primary Delivered email to the registered donor
            await sendDeliveredEmail({
              to: donorEmail,
              donationId: don._id.toString(),
              foodType: don.foodType || 'Surplus Food',
              quantity: don.quantity || reqObj?.requestedQuantity || 0,
              unit: don.unit || 'portions',
              donorName: donorDisplayName,
              ngoName: ngo?.ngoName || ngo?.userId?.name || 'NGO Partner',
              volunteerName: vol?.userId?.name || 'Assigned Volunteer',
              deliveryDate: new Date(),
              pickupLocation: pickupLocStr,
              deliveryLocation: ngoLocStr,
            });

            // Also notify NGO if distinct registered email
            if (ngoEmail && ngoEmail !== donorEmail) {
              await sendDeliveredEmail({
                to: ngoEmail,
                donationId: don._id.toString(),
                foodType: don.foodType || 'Surplus Food',
                quantity: don.quantity || reqObj?.requestedQuantity || 0,
                unit: don.unit || 'portions',
                donorName: donorDisplayName,
                ngoName: ngo?.ngoName || ngo?.userId?.name || 'NGO Partner',
                volunteerName: vol?.userId?.name || 'Assigned Volunteer',
                deliveryDate: new Date(),
                pickupLocation: pickupLocStr,
                deliveryLocation: ngoLocStr,
              });
            }
          }
        }
      } catch (err: any) {
        console.error('[EmailService] Error preparing status change email:', err?.message || err);
      }
    })();

    // Broadcast real-time events
    eventService.broadcast('pickup:updated', { pickupId: pickup._id, status });
    eventService.broadcast('donation:updated', { donationId: request?.donationId, status });

    res.json(pickup);
  } catch (error) {
    next(error);
  }
};

export const assignVolunteer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { volunteerId } = req.body;

    // If volunteer is self-assigning
    if (!volunteerId && req.user.userType === 'VOLUNTEER') {
      const vol = await Volunteer.findOne({ userId: req.user._id });
      if (!vol) return res.status(404).json({ message: 'Volunteer profile not found' });
      volunteerId = vol._id;
    }

    if (!volunteerId) {
      return res.status(400).json({ message: 'Volunteer selection is required' });
    }

    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: 'Selected volunteer was not found in the system' });
    }

    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

    pickup.volunteerId = volunteer._id;
    pickup.pickupStatus = 'ASSIGNED';
    const note = req.user.userType === 'VOLUNTEER' ? 'Volunteer accepted assignment' : 'Volunteer assigned';
    
    pickup.statusHistory.push({
      status: 'ASSIGNED',
      changedBy: req.user._id,
      changedAt: new Date(),
      note
    });
    await pickup.save();

    // Log to pickupTracking collection
    const tracking = new PickupTracking({
      pickupId: pickup._id,
      status: 'ASSIGNED',
      changedBy: req.user._id,
      changedAt: new Date(),
      note
    });
    await tracking.save();

    // Trigger email notification for assignment
    (async () => {
      try {
        const fullPickup = await Pickup.findById(pickup._id)
          .populate({
            path: 'requestId',
            populate: [
              { path: 'donationId', populate: [{ path: 'donorId', populate: ['userId', 'locationId'] }] },
              { path: 'ngoId', populate: 'userId' }
            ]
          })
          .populate({
            path: 'volunteerId',
            populate: { path: 'userId' }
          });

        const reqObj = fullPickup?.requestId as any;
        const don = reqObj?.donationId as any;
        const donor = don?.donorId as any;
        const ngo = reqObj?.ngoId as any;
        const vol = fullPickup?.volunteerId as any;

        const donorEmail = donor?.userId?.email || donor?.contactEmail;
        if (donorEmail && don) {
          await sendVolunteerStatusEmail({
            to: donorEmail,
            donorName: donor?.organizationName || donor?.contactName || donor?.userId?.name || 'Food Donor',
            donationId: don._id.toString(),
            foodType: don.foodType || 'Surplus Food',
            quantity: don.quantity || reqObj?.requestedQuantity || 0,
            unit: don.unit || 'portions',
            ngoName: ngo?.ngoName || ngo?.userId?.name || 'NGO Partner',
            volunteerName: vol?.userId?.name || 'Assigned Volunteer',
            volunteerPhone: vol?.userId?.phone,
            status: 'ASSIGNED',
            notes: note
          });
        }
      } catch (err: any) {
        console.error('[EmailService] Error sending volunteer assignment email:', err?.message || err);
      }
    })();

    // Broadcast real-time event
    eventService.broadcast('pickup:updated', { pickupId: pickup._id, status: 'ASSIGNED', volunteerId: volunteer._id });

    res.json(pickup);
  } catch (error) {
    next(error);
  }
};

export const getTrackingHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trackingRecords = await PickupTracking.find({ pickupId: req.params.id })
      .populate('changedBy', 'name email userType')
      .sort({ changedAt: 1 });

    if (trackingRecords && trackingRecords.length > 0) {
      return res.json(trackingRecords);
    }

    // Fallback to embedded statusHistory if pickupTracking not yet backfilled
    const pickup = await Pickup.findById(req.params.id)
      .populate('statusHistory.changedBy', 'name email userType');
    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });
    res.json(pickup.statusHistory);
  } catch (error) {
    next(error);
  }
};
