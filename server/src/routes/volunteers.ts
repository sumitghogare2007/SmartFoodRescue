import express from 'express';
import { getAll, getById, update, getMyProfile, getAssignedPickups } from '../controllers/volunteerController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', verifyToken, getAll);
router.get('/me', verifyToken, getMyProfile);
router.get('/me/pickups', verifyToken, requireRole(['VOLUNTEER']), getAssignedPickups);
router.get('/:id', verifyToken, getById);
router.put('/:id', verifyToken, update);

export default router;
