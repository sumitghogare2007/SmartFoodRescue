import { Request, Response, NextFunction } from 'express';
import Distribution from '../models/Distribution';
import Pickup from '../models/Pickup';
import DonationRequest from '../models/DonationRequest';
import FoodDonation from '../models/FoodDonation';

import PickupTracking from '../models/PickupTracking';
import NGO from '../models/NGO';

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

    distribution.distributionStatus = 'COMPLETED';
    if (req.body.quantityDistributed) distribution.quantityDistributed = req.body.quantityDistributed;
    if (req.body.beneficiaryCount) distribution.beneficiaryCount = req.body.beneficiaryCount;
    if (req.body.distributionDate) distribution.distributionDate = new Date(req.body.distributionDate);
    else if (!distribution.distributionDate) distribution.distributionDate = new Date();
    if (req.body.notes) distribution.notes = req.body.notes;

    await distribution.save();

    const pickup = await Pickup.findById(distribution.pickupId);
    if (pickup) {
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
    }
    res.json(distribution);
  } catch (error) {
    next(error);
  }
};
