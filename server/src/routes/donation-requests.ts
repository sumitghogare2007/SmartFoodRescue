import express from 'express';
import { getAll, getById, create, accept, reject, cancel } from '../controllers/donationRequestController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);
router.post('/', verifyToken, requireRole(['NGO', 'ADMIN']), create);
router.put('/:id/accept', verifyToken, requireRole(['DONOR', 'ADMIN']), accept);
router.put('/:id/reject', verifyToken, requireRole(['DONOR', 'ADMIN']), reject);
router.put('/:id/cancel', verifyToken, requireRole(['NGO', 'ADMIN']), cancel);

export default router;
