import express from 'express';
import { getAll, getById, updateStatus, assignVolunteer, getTrackingHistory } from '../controllers/pickupController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);
router.put('/:id/status', verifyToken, requireRole(['VOLUNTEER', 'NGO', 'ADMIN']), updateStatus);
router.put('/:id/assign-volunteer', verifyToken, requireRole(['ADMIN', 'DONOR', 'NGO', 'VOLUNTEER']), assignVolunteer);
router.get('/:id/history', verifyToken, getTrackingHistory);

export default router;
