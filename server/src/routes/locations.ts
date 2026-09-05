import express from 'express';
import Location from '../models/Location';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: 'Not found' });
    res.json(location);
  } catch (error) {
    next(error);
  }
});

router.post('/', verifyToken, async (req, res, next) => {
  try {
    const location = new Location(req.body);
    await location.save();
    res.status(201).json(location);
  } catch (error) {
    next(error);
  }
});

export default router;
