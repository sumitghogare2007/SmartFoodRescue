import express from 'express';
import { register, login, logout, me, changePassword, forgotPassword, resetPassword } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// In-memory sliding rate limiter for forgot-password endpoint (5 requests per 15 minutes per IP)
const forgotPasswordLimitMap = new Map<string, { count: number; firstRequestTime: number }>();
const FORGOT_PASSWORD_WINDOW_MS = 15 * 60 * 1000;
const FORGOT_PASSWORD_MAX_REQUESTS = 5;

const forgotPasswordRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const ipKey = String(Array.isArray(ip) ? ip[0] : ip);
  const now = Date.now();

  const record = forgotPasswordLimitMap.get(ipKey);
  if (!record || now - record.firstRequestTime > FORGOT_PASSWORD_WINDOW_MS) {
    forgotPasswordLimitMap.set(ipKey, { count: 1, firstRequestTime: now });
    return next();
  }

  if (record.count >= FORGOT_PASSWORD_MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Too many password reset requests from this network. Please try again in 15 minutes.'
    });
  }

  record.count += 1;
  next();
};

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, me);
router.post('/change-password', verifyToken, changePassword);
router.post('/forgot-password', forgotPasswordRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
