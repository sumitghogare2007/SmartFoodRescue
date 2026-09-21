import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Donor from '../models/Donor';
import NGO from '../models/NGO';
import Volunteer from '../models/Volunteer';
import Location from '../models/Location';
import crypto from 'crypto';
import { maskEmail, sanitizeError, sendPasswordResetEmail } from '../services/emailService';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '7d' as any
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  let createdUser: any = null;
  try {
    const { name, email, phone, password, userType, ...roleData } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
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

    const user = new User({ name, email: cleanEmail, phone, passwordHash: password, userType });
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
    const cleanEmail = (email || '').trim();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    
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

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const masked = maskEmail(cleanEmail);
    console.log(`[PasswordReset] Forgot password request received for: ${masked}`);

    // Generic response message returned to prevent account enumeration
    const genericResponse = {
      message: 'If an account exists with this email, a password reset link has been sent.'
    };

    // Step 1: Check users collection before doing anything
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (!user) {
      // If email does NOT exist:
      // - no token generated
      // - no DB changes
      // - no email sent
      // - return message that no user exists
      console.log(`[PasswordReset] No user exists for email: ${masked}. Returning 404.`);
      return res.status(404).json({ message: 'No user exists with this email address.' });
    }

    // Step 2: Email exists -> generate secure 32-byte token and SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry

    // Store ONLY SHA-256 hash in MongoDB (never raw token)
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpires = expiresAt;
    await user.save();

    // Construct reset URL pointing to ${FRONTEND_URL}/auth/reset-password?token=${rawToken}
    const rawFrontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const resetUrl = `${rawFrontendUrl}/auth/reset-password?token=${rawToken}`;

    console.log(`[PasswordReset] Token hash and 30m expiry saved to database for: ${masked}`);

    // Dispatch email via Gmail API OAuth 2.0 (errors safely caught and never exposed to client)
    sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      userName: user.name
    }).catch((emailErr) => {
      console.error(`[PasswordReset] Failed to send password reset email to ${masked}: ${sanitizeError(emailErr)}`);
    });

    return res.status(200).json({
      message: 'Password reset link has been sent to your email.'
    });
  } catch (error) {
    console.error('[PasswordReset] Error processing forgot password request:', sanitizeError(error));
    // Never expose internal database or API errors to frontend
    res.status(500).json({ message: 'An error occurred while processing your request. Please try again later.' });
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing password reset token.' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'New password is required.' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Hash the incoming raw token using SHA-256 to compare against stored hash
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      console.warn('[PasswordReset] Reset password attempt rejected: invalid or expired token hash.');
      return res.status(400).json({ message: 'Invalid or expired password reset link. Please request a new one.' });
    }

    // Existing User pre-save bcrypt hook hashes user.passwordHash when modified
    user.passwordHash = newPassword;
    // Use null to clear passwordResetTokenHash and passwordResetExpires
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    console.log(`[PasswordReset] Password successfully reset for user: ${maskEmail(user.email)}`);

    return res.status(200).json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('[PasswordReset] Error resetting password:', sanitizeError(error));
    res.status(500).json({ message: 'An error occurred while resetting your password. Please try again later.' });
  }
};

