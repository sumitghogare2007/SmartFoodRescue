import express from 'express';
import User from '../models/User';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', verifyToken, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
