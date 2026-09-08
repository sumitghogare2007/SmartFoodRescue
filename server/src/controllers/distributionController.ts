import { Request, Response, NextFunction } from 'express';
import Distribution from '../models/Distribution';
import Pickup from '../models/Pickup';
import DonationRequest from '../models/DonationRequest';
import FoodDonation from '../models/FoodDonation';

import PickupTracking from '../models/PickupTracking';
import NGO from '../models/NGO';
import { sendDistributedEmail } from '../services/emailService';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ngoId } = req.query;
    const filter: any = {};

    if (ngoId === 'me' && req.user) {
      const ngo = await NGO.findOne({ userId: req.user._id });
      if (!ngo) return res.json([]);
      filter.ngoId = ngo._id;
    } else if (ngoId) {
      filter.ngoId = ngoId;
    }

    const distributions = await Distribution.find(filter)
      .populate('ngoId')
      .populate({
        path: 'pickupId',
        populate: {
          path: 'requestId',
          populate: 'donationId'
        }
      })
      .sort({ createdAt: -1 });
    res.json(distributions);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const distribution = await Distribution.findById(req.params.id)
      .populate('ngoId')
      .populate({
        path: 'pickupId',
        populate: {
          path: 'requestId',
          populate: 'donationId'
        }
      });
    if (!distribution) return res.status(404).json({ message: 'Distribution not found' });
    res.json(distribution);
  } catch (error) {
    next(error);
  }
};

export const createOrUpdate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let distribution;
    if (req.params.id) {
      distribution = await Distribution.findByIdAndUpdate(req.params.id, req.body, { new: true });
    } else {
      distribution = new Distribution(req.body);
      await distribution.save();
    }
    res.json(distribution);
  } catch (error) {
    next(error);
  }
};

export const complete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const distribution = await Distribution.findById(req.params.id);
    if (!distribution) return res.status(404).json({ message: 'Distribution not found' });

    const pickup = await Pickup.findById(distribution.pickupId);
    if (!pickup) return res.status(404).json({ message: 'Associated pickup not found' });

    // Strict state flow: food must be DELIVERED before it can be DISTRIBUTED
    if (pickup.pickupStatus !== 'DELIVERED') {
      return res.status(400).json({
        message: `Invalid status transition: Food must be in DELIVERED state before distribution can be recorded. Current pickup status is ${pickup.pickupStatus}.`
      });
    }

    distribution.distributionStatus = 'COMPLETED';
    if (req.body.quantityDistributed) distribution.quantityDistributed = req.body.quantityDistributed;
    if (req.body.beneficiaryCount) distribution.beneficiaryCount = req.body.beneficiaryCount;
    if (req.body.distributionDate) distribution.distributionDate = new Date(req.body.distributionDate);
    else if (!distribution.distributionDate) distribution.distributionDate = new Date();
    if (req.body.notes) distribution.notes = req.body.notes;

    await distribution.save();

    pickup.pickupStatus = 'DISTRIBUTED';
    const historyEntry = {
      status: 'DISTRIBUTED',
      changedBy: req.user._id,
      changedAt: new Date(),
      note: req.body.notes || 'Food distributed to beneficiaries by NGO'
    };
    pickup.statusHistory.push(historyEntry);
    await pickup.save();

    // Log to pickupTracking collection
    const tracking = new PickupTracking({
      pickupId: pickup._id,
      status: 'DISTRIBUTED',
      changedBy: req.user._id,
      changedAt: new Date(),
      note: req.body.notes || 'Food distributed to beneficiaries by NGO'
    });
    await tracking.save();

    const request = await DonationRequest.findById(pickup.requestId);
    if (request) {
      request.requestStatus = 'COMPLETED';
      await request.save();

      const donation = await FoodDonation.findById(request.donationId);
      if (donation) {
        donation.status = 'DISTRIBUTED';
        await donation.save();
      }
    }

    // Trigger email notification for food distributed (asynchronous, non-blocking)
    (async () => {
      try {
        const fullPickup = await Pickup.findById(pickup._id)
          .populate({
            path: 'requestId',
            populate: [
              { path: 'donationId', populate: [{ path: 'donorId', populate: 'userId' }] },
              { path: 'ngoId', populate: 'userId' }
            ]
          });

        const reqObj = fullPickup?.requestId as any;
        const don = reqObj?.donationId as any;
        const donor = don?.donorId as any;
        const ngo = reqObj?.ngoId as any;

        const donorEmail = donor?.contactEmail || donor?.userId?.email;
        const ngoEmail = ngo?.contactEmail || ngo?.userId?.email;

        const recipients = Array.from(new Set([donorEmail, ngoEmail].filter(Boolean) as string[]));

        if (recipients.length > 0 && don) {
          await sendDistributedEmail({
            to: recipients,
            distributionId: distribution._id.toString(),
            foodType: don.foodType || 'Surplus Food',
            quantityDistributed: distribution.quantityDistributed || don.quantity || 'All',
            unit: don.unit || 'portions',
            ngoName: ngo?.ngoName || ngo?.userId?.name || 'Partner NGO',
            beneficiaryCount: distribution.beneficiaryCount,
            distributionDate: distribution.distributionDate || new Date(),
            notes: distribution.notes || undefined
          });
        }
      } catch (err: any) {
        console.error('[EmailService] Error preparing distributed email:', err.message);
      }
    })();

    res.json(distribution);
  } catch (error) {
    next(error);
  }
};
