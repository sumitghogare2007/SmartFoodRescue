import { Request, Response, NextFunction } from 'express';
import DonationRequest from '../models/DonationRequest';
import FoodDonation from '../models/FoodDonation';
import NGO from '../models/NGO';
import Pickup from '../models/Pickup';
import Volunteer from '../models/Volunteer';
import PickupTracking from '../models/PickupTracking';
import Donor from '../models/Donor';
import { sendRequestPlacedEmail } from '../services/emailService';

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

    // Trigger email notification for request placed (asynchronous, non-blocking)
    (async () => {
      try {
        const fullDonation = await FoodDonation.findById(donation._id)
          .populate({ path: 'donorId', populate: ['userId', 'locationId'] })
          .populate('locationId');
        const fullNgo = await NGO.findById(ngo._id).populate('userId');

        const donor = fullDonation?.donorId as any;
        const donorEmail = donor?.contactEmail || donor?.userId?.email;
        const ngoEmail = fullNgo?.contactEmail || (fullNgo?.userId as any)?.email;

        const recipients: string[] = [];
        if (donorEmail) recipients.push(donorEmail);
        if (ngoEmail && !recipients.includes(ngoEmail)) recipients.push(ngoEmail);

        if (recipients.length > 0 && fullDonation) {
          const loc = (fullDonation.locationId as any) || (donor?.locationId as any);
          const locStr = loc ? `${loc.address}, ${loc.area}, ${loc.city}` : 'Donor Address on file';

          await sendRequestPlacedEmail({
            to: recipients,
            requestId: request._id.toString(),
            foodType: fullDonation.foodType,
            quantity: request.requestedQuantity,
            unit: fullDonation.unit,
            donorName: donor?.organizationName || donor?.contactName || donor?.userId?.name || 'Registered Donor',
            ngoName: fullNgo?.ngoName || (fullNgo?.userId as any)?.name || 'Partner NGO',
            pickupLocation: locStr,
            status: 'PENDING',
            expectedPickupInfo: request.message || undefined
          });
        }
      } catch (err: any) {
        console.error('[EmailService] Error preparing request placed email:', err.message);
      }
    })();

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

    // Select assigned volunteer from request body or find eligible volunteer from MongoDB
    let volunteer = null;
    if (req.body?.volunteerId) {
      volunteer = await Volunteer.findById(req.body.volunteerId);
      if (!volunteer) {
        return res.status(400).json({ message: 'Selected volunteer does not exist in database' });
      }
    } else {
      volunteer = await Volunteer.findOne({ availability: 'Available' });
      if (!volunteer) {
        volunteer = await Volunteer.findOne({});
      }
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
