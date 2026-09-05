import { Request, Response, NextFunction } from 'express';
import DonationRequest from '../models/DonationRequest';
import FoodDonation from '../models/FoodDonation';
import NGO from '../models/NGO';
import Pickup from '../models/Pickup';
import Volunteer from '../models/Volunteer';

import PickupTracking from '../models/PickupTracking';
import Donor from '../models/Donor';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ngoId, donorId, donationId, status } = req.query;
    const filter: any = {};

    if (ngoId === 'me' && req.user) {
      const ngo = await NGO.findOne({ userId: req.user._id });
      if (!ngo) return res.json([]);
      filter.ngoId = ngo._id;
    } else if (ngoId) {
      filter.ngoId = ngoId;
    }

    if (donorId === 'me' && req.user) {
      const donor = await Donor.findOne({ userId: req.user._id });
      if (donor) {
        const donations = await FoodDonation.find({ donorId: donor._id }).select('_id');
        filter.donationId = { $in: donations.map(d => d._id) };
      }
    } else if (donationId) {
      filter.donationId = donationId;
    }

    if (status) filter.requestStatus = status;

    const requests = await DonationRequest.find(filter)
      .populate('ngoId')
      .populate('donationId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await DonationRequest.findById(req.params.id)
      .populate('ngoId')
      .populate('donationId');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ngo = await NGO.findOne({ userId: req.user._id });
    if (!ngo) return res.status(403).json({ message: 'Only NGOs can create requests' });

    const donation = await FoodDonation.findById(req.body.donationId);
    if (!donation || donation.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Donation is not available' });
    }

    if (new Date() > new Date(donation.expiryTime)) {
      donation.status = 'EXPIRED';
      await donation.save();
      return res.status(400).json({ message: 'Donation has expired and cannot be requested' });
    }

    const request = new DonationRequest({
      ...req.body,
      ngoId: ngo._id,
      requestStatus: 'PENDING'
    });
    await request.save();

    donation.status = 'REQUESTED';
    await donation.save();

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

export const accept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.requestStatus = 'ACCEPTED';
    await request.save();

    const donation = await FoodDonation.findById(request.donationId);
    if (donation) {
      donation.status = 'ASSIGNED';
      await donation.save();
    }

    // Assign available volunteer or set to first registered volunteer
    let volunteer = await Volunteer.findOne({ availability: 'Available' });
    if (!volunteer) {
      volunteer = await Volunteer.findOne({});
    }

    const pickup = new Pickup({
      requestId: request._id,
      volunteerId: volunteer?._id,
      pickupDate: new Date(),
      pickupStatus: 'ASSIGNED',
      statusHistory: [{
        status: 'ASSIGNED',
        changedBy: req.user._id,
        changedAt: new Date(),
        note: 'Pickup created and assigned upon request acceptance'
      }]
    });
    await pickup.save();

    // Log to pickupTracking collection
    const tracking = new PickupTracking({
      pickupId: pickup._id,
      status: 'ASSIGNED',
      changedBy: req.user._id,
      changedAt: new Date(),
      note: 'Pickup created and assigned upon request acceptance'
    });
    await tracking.save();

    res.json({ request, pickup });
  } catch (error) {
    next(error);
  }
};

export const reject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.requestStatus = 'REJECTED';
    await request.save();

    const donation = await FoodDonation.findById(request.donationId);
    if (donation) {
      donation.status = 'AVAILABLE';
      await donation.save();
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const cancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.requestStatus = 'CANCELLED';
    await request.save();

    const donation = await FoodDonation.findById(request.donationId);
    if (donation && donation.status === 'REQUESTED') {
      donation.status = 'AVAILABLE';
      await donation.save();
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
};
