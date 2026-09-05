import express from 'express';
import { register, login, logout, me } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, me);

export default router;
