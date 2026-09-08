import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Donor from '../models/Donor';
import NGO from '../models/NGO';
import Volunteer from '../models/Volunteer';
import Location from '../models/Location';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '7d' as any
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  let createdUser: any = null;
  try {
    const { name, email, phone, password, userType, ...roleData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      let existingProfile = null;
      if (existingUser.userType === 'DONOR') existingProfile = await Donor.findOne({ userId: existingUser._id });
      else if (existingUser.userType === 'NGO') existingProfile = await NGO.findOne({ userId: existingUser._id });
      else if (existingUser.userType === 'VOLUNTEER') existingProfile = await Volunteer.findOne({ userId: existingUser._id });

      if (!existingProfile) {
        await User.findByIdAndDelete(existingUser._id);
      } else {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    const user = new User({ name, email, phone, passwordHash: password, userType });
    await user.save();
    createdUser = user;

    let roleRecord;
    if (userType === 'DONOR') {
      const locData = roleData.location || {};
      const location = new Location({
        address: locData.address || roleData.address || `${name}'s Facility`,
        area: locData.area || roleData.area || 'Downtown',
        city: locData.city || roleData.city || 'Mumbai',
        pincode: locData.pincode || roleData.pincode || '400001',
        latitude: locData.latitude || roleData.latitude || 19.076,
        longitude: locData.longitude || roleData.longitude || 72.8777
      });
      await location.save();

      roleRecord = new Donor({
        userId: user._id,
        donorType: roleData.donorType || 'Restaurant',
        organizationName: roleData.organizationName || name,
        contactName: roleData.contactName || name,
        contactPhone: roleData.contactPhone || phone,
        contactEmail: roleData.contactEmail || email,
        locationId: location._id,
        isVerified: true
      });
      await roleRecord.save();
    } else if (userType === 'NGO') {
      const locData = roleData.location || {};
      const location = new Location({
        address: locData.address || roleData.address || `${name}'s Office`,
        area: locData.area || roleData.area || 'District 1',
        city: locData.city || roleData.city || 'Mumbai',
        pincode: locData.pincode || roleData.pincode || '400001',
        latitude: locData.latitude || roleData.latitude || 19.076,
        longitude: locData.longitude || roleData.longitude || 72.8777
      });
      await location.save();

      roleRecord = new NGO({
        userId: user._id,
        ngoName: roleData.ngoName || name,
        registrationNo: roleData.registrationNo || `REG-${Date.now().toString().slice(-6)}`,
        contactNo: roleData.contactNo || phone,
        contactEmail: roleData.contactEmail || email,
        locationId: location._id,
        capacity: Number(roleData.capacity) || 100,
        isVerified: true
      });
      await roleRecord.save();
    } else if (userType === 'VOLUNTEER') {
      roleRecord = new Volunteer({
        userId: user._id,
        availability: roleData.availability || 'Available',
        vehicleType: roleData.vehicleType || 'Bike',
        isVerified: true
      });
      await roleRecord.save();
    }

    const token = generateToken(user._id.toString());
    const safeUser = await User.findById(user._id).select('-passwordHash');
    res.status(201).json({ user: safeUser, roleRecord, token });
  } catch (error) {
    if (createdUser && createdUser._id) {
      await User.findByIdAndDelete(createdUser._id).catch(() => {});
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString());
    let roleRecord;
    
    if (user.userType === 'DONOR') roleRecord = await Donor.findOne({ userId: user._id }).populate('locationId');
    else if (user.userType === 'NGO') roleRecord = await NGO.findOne({ userId: user._id }).populate('locationId');
    else if (user.userType === 'VOLUNTEER') roleRecord = await Volunteer.findOne({ userId: user._id });

    // Exclude passwordHash from response
    const safeUser = await User.findById(user._id).select('-passwordHash');
    res.json({ user: safeUser, roleRecord, token });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    
    let roleRecord;
    if (user.userType === 'DONOR') roleRecord = await Donor.findOne({ userId: user._id }).populate('locationId');
    else if (user.userType === 'NGO') roleRecord = await NGO.findOne({ userId: user._id }).populate('locationId');
    else if (user.userType === 'VOLUNTEER') roleRecord = await Volunteer.findOne({ userId: user._id });

    res.json({ user, roleRecord });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Current password, new password, and confirmation are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirmation do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
