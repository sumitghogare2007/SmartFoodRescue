import express from 'express';
import { register, login, logout, me, changePassword } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, me);
router.post('/change-password', verifyToken, changePassword);

export default router;
