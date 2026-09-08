import { Request, Response, NextFunction } from 'express';
import Volunteer from '../models/Volunteer';
import Pickup from '../models/Pickup';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { available } = req.query;
    const filter: any = {};
    if (available === 'true') {
      filter.availability = 'Available';
    }
    const volunteers = await Volunteer.find(filter)
      .populate('userId', '-passwordHash')
      .sort({ createdAt: -1 });
    res.json(volunteers);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id).populate('userId', '-passwordHash');
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    res.json(volunteer);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(volunteer);
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) return res.status(404).json({ message: 'Profile not found' });
    res.json(volunteer);
  } catch (error) {
    next(error);
  }
};

export const getAssignedPickups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) return res.status(404).json({ message: 'Volunteer profile not found' });
    
    const pickups = await Pickup.find({ volunteerId: volunteer._id })
      .populate({
        path: 'requestId',
        populate: [
          { path: 'donationId', populate: ['donorId', 'locationId'] },
          { path: 'ngoId', populate: 'locationId' }
        ]
      });
    res.json(pickups);
  } catch (error) {
    next(error);
  }
};
