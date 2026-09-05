import { Request, Response, NextFunction } from 'express';
import Donor from '../models/Donor';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donors = await Donor.find().populate('userId', '-passwordHash').populate('locationId');
    res.json(donors);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donor = await Donor.findById(req.params.id).populate('userId', '-passwordHash').populate('locationId');
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(donor);
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id }).populate('locationId');
    if (!donor) return res.status(404).json({ message: 'Profile not found' });
    res.json(donor);
  } catch (error) {
    next(error);
  }
};
