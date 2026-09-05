import express from 'express';
import { getAll, getById, create, update, cancel, getMyDonations, markExpired } from '../controllers/donationController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', getAll);
router.get('/my/donations', verifyToken, requireRole(['DONOR']), getMyDonations);
router.post('/mark-expired', verifyToken, requireRole(['ADMIN']), markExpired);
router.get('/:id', getById);
router.post('/', verifyToken, requireRole(['DONOR']), create);
router.put('/:id', verifyToken, requireRole(['DONOR', 'ADMIN']), update);
router.delete('/:id', verifyToken, requireRole(['DONOR', 'ADMIN']), cancel);

export default router;
