import express from 'express';
import { getAll, getById, create, update, cancel, getMyDonations, markExpired } from '../controllers/donationController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', getAll);
router.get('/diagnostic/donor-resolution', verifyToken, async (req, res) => {
  try {
    const User = (await import('../models/User')).default;
    const Donor = (await import('../models/Donor')).default;
    const FoodDonation = (await import('../models/FoodDonation')).default;
    const { maskEmail } = await import('../services/emailService');

    const rawUserId = req.user?._id?.toString() || '';
    const user = await User.findById(rawUserId).select('-passwordHash');
    const donor = await Donor.findOne({ userId: rawUserId });

    const maskId = (id?: any) => {
      if (!id) return 'none';
      const s = id.toString();
      return s.length > 8 ? `${s.slice(0, 4)}...${s.slice(-4)}` : s;
    };

    let donationVerification = undefined;
    if (req.query.donationId) {
      const don = await FoodDonation.findById(req.query.donationId as string);
      if (don) {
        donationVerification = {
          donationId: maskId(don._id),
          donationDonorId: maskId(don.donorId),
          donorMatchesAuthUser: donor?._id ? don.donorId.toString() === donor._id.toString() : false
        };
      }
    }

    res.json({
      authenticatedUserId: maskId(rawUserId),
      authenticatedUserFound: Boolean(user),
      authenticatedUserEmailExists: Boolean(user?.email),
      maskedAuthenticatedEmail: user?.email ? maskEmail(user.email) : 'none',
      donorId: maskId(donor?._id),
      userDonorResolution: donor ? 'SUCCESS' : 'FAILED',
      resolvedRecipientEmail: user?.email ? maskEmail(user.email) : 'none',
      authoritativeSource: 'User.email',
      donationVerification
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Diagnostic query failed' });
  }
});
router.get('/my/donations', verifyToken, requireRole(['DONOR']), getMyDonations);
router.post('/mark-expired', verifyToken, requireRole(['ADMIN']), markExpired);
router.get('/:id', getById);
router.post('/', verifyToken, requireRole(['DONOR']), create);
router.put('/:id', verifyToken, requireRole(['DONOR', 'ADMIN']), update);
router.delete('/:id', verifyToken, requireRole(['DONOR', 'ADMIN']), cancel);

export default router;
