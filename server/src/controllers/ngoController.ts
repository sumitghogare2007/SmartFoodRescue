import { Request, Response, NextFunction } from 'express';
import NGO from '../models/NGO';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ngos = await NGO.find().populate('userId', '-passwordHash').populate('locationId');
    res.json(ngos);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ngo = await NGO.findById(req.params.id).populate('userId', '-passwordHash').populate('locationId');
    if (!ngo) return res.status(404).json({ message: 'NGO not found' });
    res.json(ngo);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ngo = await NGO.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ngo);
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ngo = await NGO.findOne({ userId: req.user._id }).populate('locationId');
    if (!ngo) return res.status(404).json({ message: 'Profile not found' });
    res.json(ngo);
  } catch (error) {
    next(error);
  }
};
