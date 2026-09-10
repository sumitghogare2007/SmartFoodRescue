import mongoose from 'mongoose';
import User from '../models/User';
import Donor from '../models/Donor';
import FoodDonation from '../models/FoodDonation';
import DonationRequest from '../models/DonationRequest';
import Pickup from '../models/Pickup';
import { maskEmail } from './emailService';

export interface ResolvedDonorRecipient {
  email: string | null;
  donorName: string;
  donorId?: string;
  userId?: string;
}

/**
 * Validates whether an email string is structurally valid.
 */
export const isValidEmail = (email?: string | null): boolean => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

/**
 * 1. Resolve donor email from an authenticated User ID (JWT session).
 * Path: JWT userId -> User.findById(userId) -> user.email
 */
export const resolveDonorFromUser = async (
  userId: string | mongoose.Types.ObjectId
): Promise<ResolvedDonorRecipient> => {
  try {
    const uId = typeof userId === 'string' ? userId.trim() : userId.toString();
    const user = await User.findById(uId).select('-passwordHash');

    if (!user) {
      console.warn(`[RecipientService] User record not found for ID: ${uId}`);
      return { email: null, donorName: 'Food Donor', userId: uId };
    }

    // Find donor record linked to this user (if exists)
    const donor = await Donor.findOne({ userId: user._id });
    if (donor) {
      console.log(`[RecipientService] Donor resolved: ${donor._id.toString()}`);
    }

    const registeredEmail = user.email ? user.email.trim().toLowerCase() : null;
    const donorDisplayName = user.name || donor?.contactName || donor?.organizationName || 'Food Donor';

    if (registeredEmail && isValidEmail(registeredEmail)) {
      console.log(`[RecipientService] Recipient email resolved successfully (Masked: ${maskEmail(registeredEmail)})`);
      return {
        email: registeredEmail,
        donorName: donorDisplayName,
        donorId: donor?._id ? donor._id.toString() : undefined,
        userId: user._id.toString()
      };
    } else {
      console.warn(`[RecipientService] User ${uId} does not have a valid registered email in MongoDB.`);
      return {
        email: null,
        donorName: donorDisplayName,
        donorId: donor?._id ? donor._id.toString() : undefined,
        userId: user._id.toString()
      };
    }
  } catch (error: any) {
    console.error(`[RecipientService] Error resolving donor from user:`, error?.message || error);
    return { email: null, donorName: 'Food Donor' };
  }
};

/**
 * 2. Resolve donor email from a FoodDonation ID.
 * Path: FoodDonation -> donorId -> Donor -> userId -> User -> user.email
 */
export const resolveDonorFromDonation = async (
  donationId: string | mongoose.Types.ObjectId
): Promise<ResolvedDonorRecipient> => {
  try {
    const donIdStr = typeof donationId === 'string' ? donationId.trim() : donationId.toString();
    console.log(`[RecipientService] Resolving donor email for donation: ${donIdStr}`);

    const donation = await FoodDonation.findById(donIdStr);
    if (!donation) {
      console.warn(`[RecipientService] Donation record not found for ID: ${donIdStr}`);
      return { email: null, donorName: 'Food Donor' };
    }

    if (!donation.donorId) {
      console.warn(`[RecipientService] Donation #${donIdStr} has no donorId association.`);
      return { email: null, donorName: 'Food Donor' };
    }

    return resolveDonorFromDonorId(donation.donorId);
  } catch (error: any) {
    console.error(`[RecipientService] Error resolving donor from donation:`, error?.message || error);
    return { email: null, donorName: 'Food Donor' };
  }
};

/**
 * Helper to resolve donor email directly from a Donor ID.
 * Path: Donor -> userId -> User -> user.email
 */
export const resolveDonorFromDonorId = async (
  donorId: string | mongoose.Types.ObjectId
): Promise<ResolvedDonorRecipient> => {
  try {
    const dIdStr = typeof donorId === 'string' ? donorId.trim() : donorId.toString();
    const donor = await Donor.findById(dIdStr);

    if (!donor) {
      console.warn(`[RecipientService] Donor record not found for ID: ${dIdStr}`);
      return { email: null, donorName: 'Food Donor', donorId: dIdStr };
    }

    console.log(`[RecipientService] Donor resolved: ${donor._id.toString()}`);

    let registeredEmail: string | null = null;
    let donorName = donor.contactName || donor.organizationName || 'Food Donor';

    if (donor.userId) {
      const user = await User.findById(donor.userId).select('-passwordHash');
      if (user && user.email && isValidEmail(user.email)) {
        registeredEmail = user.email.trim().toLowerCase();
        donorName = user.name || donorName;
      }
    }

    // Only if User.email was not available, check if donor has a valid registered contactEmail
    if (!registeredEmail && donor.contactEmail && isValidEmail(donor.contactEmail)) {
      registeredEmail = donor.contactEmail.trim().toLowerCase();
    }

    if (registeredEmail) {
      console.log(`[RecipientService] Recipient email resolved successfully (Masked: ${maskEmail(registeredEmail)})`);
      return {
        email: registeredEmail,
        donorName,
        donorId: donor._id.toString(),
        userId: donor.userId ? donor.userId.toString() : undefined
      };
    } else {
      console.warn(`[RecipientService] No verified registered email found in MongoDB for donor: ${dIdStr}`);
      return {
        email: null,
        donorName,
        donorId: donor._id.toString(),
        userId: donor.userId ? donor.userId.toString() : undefined
      };
    }
  } catch (error: any) {
    console.error(`[RecipientService] Error resolving donor from donorId:`, error?.message || error);
    return { email: null, donorName: 'Food Donor' };
  }
};

/**
 * 3. Resolve donor email from a DonationRequest ID.
 * Path: DonationRequest -> donationId -> FoodDonation -> Donor -> User -> user.email
 */
export const resolveDonorFromRequest = async (
  requestId: string | mongoose.Types.ObjectId
): Promise<ResolvedDonorRecipient> => {
  try {
    const reqIdStr = typeof requestId === 'string' ? requestId.trim() : requestId.toString();
    const request = await DonationRequest.findById(reqIdStr);

    if (!request || !request.donationId) {
      console.warn(`[RecipientService] DonationRequest or donationId missing for ID: ${reqIdStr}`);
      return { email: null, donorName: 'Food Donor' };
    }

    return resolveDonorFromDonation(request.donationId);
  } catch (error: any) {
    console.error(`[RecipientService] Error resolving donor from request:`, error?.message || error);
    return { email: null, donorName: 'Food Donor' };
  }
};

/**
 * 4. Resolve donor email from a Pickup ID.
 * Path: Pickup -> requestId -> DonationRequest -> donationId -> FoodDonation -> Donor -> User -> user.email
 */
export const resolveDonorFromPickup = async (
  pickupId: string | mongoose.Types.ObjectId
): Promise<ResolvedDonorRecipient> => {
  try {
    const pIdStr = typeof pickupId === 'string' ? pickupId.trim() : pickupId.toString();
    const pickup = await Pickup.findById(pIdStr);

    if (!pickup || !pickup.requestId) {
      console.warn(`[RecipientService] Pickup or requestId missing for ID: ${pIdStr}`);
      return { email: null, donorName: 'Food Donor' };
    }

    return resolveDonorFromRequest(pickup.requestId);
  } catch (error: any) {
    console.error(`[RecipientService] Error resolving donor from pickup:`, error?.message || error);
    return { email: null, donorName: 'Food Donor' };
  }
};
