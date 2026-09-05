import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error';
import connectDB from './config/db';

// Import Routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import donorsRoutes from './routes/donors';
import ngosRoutes from './routes/ngos';
import volunteersRoutes from './routes/volunteers';
import donationsRoutes from './routes/donations';
import foodItemsRoutes from './routes/food-items';
import locationsRoutes from './routes/locations';
import donationRequestsRoutes from './routes/donation-requests';
import pickupsRoutes from './routes/pickups';
import distributionsRoutes from './routes/distributions';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // In development or when FRONTEND_URL is '*', allow all
    if (process.env.NODE_ENV !== 'production' || process.env.FRONTEND_URL === '*') {
      return callback(null, true);
    }

    // Allow configured origins or any Vercel deployment (*.vercel.app)
    try {
      const hostname = new URL(origin).hostname;
      if (allowedOrigins.includes(origin) || hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch {
      if (allowedOrigins.includes(origin)) return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isConnected ? 'OK' : 'DEGRADED',
    database: 'MongoDB',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database readiness check middleware
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    const isAtlas = (process.env.MONGODB_URI || '').includes('+srv');
    const message = isAtlas
      ? 'MongoDB connection failed. Please ensure MongoDB Atlas connection string is valid and Network Access allows access.'
      : 'MongoDB connection failed. Please make sure MongoDB Community Server is running.';
    return res.status(503).json({
      success: false,
      message
    });
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/donors', donorsRoutes);
app.use('/api/ngos', ngosRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/food-items', foodItemsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/donation-requests', donationRequestsRoutes);
app.use('/api/pickups', pickupsRoutes);
app.use('/api/distributions', distributionsRoutes);
app.use('/api/stats', statsRoutes);

// Error Handling
app.use(errorHandler);

// Connect to Database and start server
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (bound to 0.0.0.0)`);
  });
});

