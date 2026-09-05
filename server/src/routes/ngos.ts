import express from 'express';
import { getAll, getById, update, getMyProfile } from '../controllers/ngoController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

router.get('/', verifyToken, getAll);
router.get('/me', verifyToken, getMyProfile);
router.get('/:id', verifyToken, getById);
router.put('/:id', verifyToken, update);

export default router;
