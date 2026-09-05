import express from 'express';
import FoodItem from '../models/FoodItem';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { donationId } = req.query;
    const items = await FoodItem.find(donationId ? { donationId } : {});
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/', verifyToken, requireRole(['DONOR']), async (req, res, next) => {
  try {
    const item = new FoodItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', verifyToken, requireRole(['DONOR', 'ADMIN']), async (req, res, next) => {
  try {
    await FoodItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
