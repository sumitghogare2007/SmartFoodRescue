import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Donor from '../models/Donor';
import NGO from '../models/NGO';
import Volunteer from '../models/Volunteer';
import FoodDonation from '../models/FoodDonation';
import Pickup from '../models/Pickup';
import Distribution from '../models/Distribution';

export const getPlatformStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await Donor.countDocuments();
    const totalNgos = await NGO.countDocuments();
    const totalVolunteers = await Volunteer.countDocuments();

    const totalDonations = await FoodDonation.countDocuments();
    const availableDonations = await FoodDonation.countDocuments({ status: 'AVAILABLE', expiryTime: { $gt: new Date() } });

    const activePickups = await Pickup.countDocuments({ pickupStatus: { $in: ['ASSIGNED', 'RECEIVED', 'DISPATCHED'] } });
    const completedDistributions = await Distribution.countDocuments({ distributionStatus: 'COMPLETED' });

    const foodRescuedAgg = await FoodDonation.aggregate([
      { $match: { status: { $in: ['DELIVERED', 'DISTRIBUTED'] } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const beneficiariesAgg = await Distribution.aggregate([
      { $match: { distributionStatus: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$beneficiaryCount' } } }
    ]);

    const peopleServed = beneficiariesAgg.length > 0 ? (beneficiariesAgg[0].total || 0) : 0;
    const foodRescued = foodRescuedAgg.length > 0 ? (foodRescuedAgg[0].total || 0) : 0;

    res.json({
      totalUsers,
      totalDonors,
      totalNgos,
      totalNGOs: totalNgos,
      totalVolunteers,
      totalDonations,
      availableDonations,
      availableFood: availableDonations,
      activePickups,
      activePicups: activePickups,
      completedDistributions,
      peopleServed,
      beneficiaries: peopleServed,
      foodRescued
    });
  } catch (error) {
    next(error);
  }
};
