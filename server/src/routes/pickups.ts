import express from 'express';
import { getAll, getById, updateStatus, assignVolunteer, getTrackingHistory } from '../controllers/pickupController';
import {
  startTracking,
  stopTracking,
  getLiveTracking,
  getPickupRoute,
  updateLocationHttp
} from '../controllers/trackingController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);
router.put('/:id/status', verifyToken, requireRole(['VOLUNTEER', 'NGO', 'ADMIN']), updateStatus);
router.put('/:id/assign-volunteer', verifyToken, requireRole(['ADMIN', 'DONOR', 'NGO', 'VOLUNTEER']), assignVolunteer);
router.get('/:id/history', verifyToken, getTrackingHistory);

// Real-Time Live GPS Tracking & Navigation Endpoints
router.post('/:pickupId/tracking/start', verifyToken, requireRole(['VOLUNTEER', 'ADMIN']), startTracking);
router.post('/:pickupId/tracking/stop', verifyToken, requireRole(['VOLUNTEER', 'ADMIN']), stopTracking);
router.get('/:pickupId/tracking', verifyToken, getLiveTracking);
router.get('/:pickupId/route', verifyToken, getPickupRoute);
router.post('/:pickupId/location', verifyToken, requireRole(['VOLUNTEER', 'ADMIN']), updateLocationHttp);

export default router;
