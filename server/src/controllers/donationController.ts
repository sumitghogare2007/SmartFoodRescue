import { Request, Response, NextFunction } from 'express';
import FoodDonation from '../models/FoodDonation';
import Donor from '../models/Donor';

// Mask aadhaar: XXXX-XXXX-1234 (show only last 4 digits)
const maskAadhaar = (aadhaar?: string): string | undefined => {
  if (!aadhaar) return undefined;
  const parts = aadhaar.split('-');
  if (parts.length === 3) {
    return `XXXX-XXXX-${parts[2]}`;
  }
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
};

const maskDonation = (donation: any) => {
  const obj = donation.toObject ? donation.toObject({ virtuals: true }) : donation;
  if (obj.aadhaarId) obj.aadhaarId = maskAadhaar(obj.aadhaarId);
  return obj;
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, category, excludeExpired } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.foodCategory = category;
    if (excludeExpired === 'true') {
      filter.expiryTime = { $gt: new Date() };
    }

    const donations = await FoodDonation.find(filter)
      .populate('donorId')
      .populate('locationId')
      .sort({ createdAt: -1 });
    res.json(donations.map(maskDonation));
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donation = await FoodDonation.findById(req.params.id)
      .populate('donorId')
      .populate('locationId');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json(maskDonation(donation));
  } catch (error) {
    next(error);
  }
};

import Location from '../models/Location';
import FoodItem from '../models/FoodItem';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) return res.status(403).json({ message: 'Only donors can create donations' });

    const {
      foodType,
      foodName,
      foodCategory,
      quantity,
      unit,
      preparationTime,
      expiryTime,
      isVegetarian,
      aadhaarId,
      notes,
      locationId,
      locationInfo
    } = req.body;

    // Validations
    if (!foodType || !quantity || !expiryTime) {
      return res.status(400).json({ message: 'Food type, quantity, and expiry time are required.' });
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0.' });
    }

    const expiryDate = new Date(expiryTime);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({ message: 'Invalid expiry time format.' });
    }

    if (preparationTime) {
      const prepDate = new Date(preparationTime);
      if (expiryDate <= prepDate) {
        return res.status(400).json({ message: 'Expiry time must be greater than preparation time.' });
      }
    }

    if (aadhaarId) {
      const cleanAadhaar = aadhaarId.replace(/[\s-]/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return res.status(400).json({ message: 'Aadhaar ID must be a valid 12-digit number.' });
      }
    }

    // Determine locationId
    let finalLocationId = locationId;
    if (!finalLocationId && locationInfo && locationInfo.address) {
      const newLoc = new Location({
        address: locationInfo.address,
        area: locationInfo.area || 'Downtown',
        city: locationInfo.city || 'Mumbai',
        pincode: locationInfo.pincode || '400001'
      });
      await newLoc.save();
      finalLocationId = newLoc._id;
    } else if (!finalLocationId) {
      finalLocationId = donor.locationId;
    }

    const donation = new FoodDonation({
      donorId: donor._id,
      locationId: finalLocationId,
      donationDate: new Date(),
      quantity: numQuantity,
      unit: unit || 'kg',
      foodType,
      foodCategory: foodCategory || 'Cooked',
      preparationTime: preparationTime ? new Date(preparationTime) : undefined,
      expiryTime: expiryDate,
      status: 'AVAILABLE',
      aadhaarId,
      notes,
      isVegetarian: isVegetarian !== undefined ? Boolean(isVegetarian) : true
    });
    await donation.save();

    // Create corresponding FoodItem in foodItems collection
    const item = new FoodItem({
      donationId: donation._id,
      foodName: foodName || foodType,
      foodCategory: foodCategory || 'Cooked',
      foodType: foodType,
      quantity: numQuantity,
      unit: unit || 'kg',
      isVegetarian: donation.isVegetarian
    });
    await item.save();

    const populated = await FoodDonation.findById(donation._id)
      .populate('donorId')
      .populate('locationId');

    res.status(201).json(maskDonation(populated));
  } catch (error) {
    next(error);
  }
};


export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    if (req.user.userType !== 'ADMIN' && donation.donorId.toString() !== donor?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await FoodDonation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const cancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    if (req.user.userType !== 'ADMIN' && donation.donorId.toString() !== donor?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    donation.status = 'CANCELLED';
    await donation.save();
    res.json(donation);
  } catch (error) {
    next(error);
  }
};

export const getMyDonations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });
    
    const donations = await FoodDonation.find({ donorId: donor._id }).populate('locationId').sort({ createdAt: -1 });
    res.json(donations.map(maskDonation));
  } catch (error) {
    next(error);
  }
};

export const markExpired = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await FoodDonation.updateMany(
      { expiryTime: { $lt: new Date() }, status: { $in: ['AVAILABLE', 'REQUESTED', 'ACCEPTED'] } },
      { $set: { status: 'EXPIRED' } }
    );
    res.json({ message: `${result.modifiedCount} donations marked as expired` });
  } catch (error) {
    next(error);
  }
};
