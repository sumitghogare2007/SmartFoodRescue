import { Request, Response, NextFunction } from 'express';
import NGO from '../models/NGO';
import Location from '../models/Location';

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
    let ngo = await NGO.findOne({ userId: req.user._id }).populate('locationId');
    if (!ngo && (req.user.userType === 'NGO' || req.user.userType === 'ADMIN')) {
      if (req.user.userType === 'ADMIN') {
        ngo = await NGO.findOne().populate('locationId');
      } else {
        const defaultLoc = await Location.findOne();
        ngo = new NGO({
          userId: req.user._id,
          ngoName: req.user.name || 'Community Partner NGO',
          registrationNo: `REG-${Date.now().toString().slice(-6)}`,
          contactNo: req.user.phone || '9999999999',
          contactEmail: req.user.email,
          locationId: defaultLoc?._id,
          isVerified: true
        });
        await ngo.save();
        ngo = await NGO.findById(ngo._id).populate('locationId');
      }
    }
    if (!ngo) return res.status(404).json({ message: 'Profile not found' });
    res.json(ngo);
  } catch (error) {
    next(error);
  }
};
