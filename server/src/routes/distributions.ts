import express from 'express';
import { getAll, getById, createOrUpdate, complete } from '../controllers/distributionController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);
router.post('/', verifyToken, requireRole(['NGO', 'ADMIN']), createOrUpdate);
router.put('/:id', verifyToken, requireRole(['NGO', 'ADMIN']), createOrUpdate);
router.put('/:id/complete', verifyToken, requireRole(['NGO', 'ADMIN']), complete);

export default router;
