import express from 'express';
import Location from '../models/Location';
import { verifyToken } from '../middleware/auth';
import Donor from '../models/Donor';
import NGO from '../models/NGO';
import { validateLocation } from '../services/trackingValidation';

const router = express.Router();

router.put('/:id/coordinates', verifyToken, async (req, res, next) => {
  try {
    const error = validateLocation(req.body);
    if (error) return res.status(400).json({ message: error });
    const [donor, ngo] = await Promise.all([
      Donor.findOne({ userId: req.user._id, locationId: req.params.id }),
      NGO.findOne({ userId: req.user._id, locationId: req.params.id })
    ]);
    if (!donor && !ngo) return res.status(403).json({ message: 'You can update only your own facility location.' });
    const [otherDonor, otherNgo] = await Promise.all([
      Donor.exists({ userId: { $ne: req.user._id }, locationId: req.params.id }),
      NGO.exists({ userId: { $ne: req.user._id }, locationId: req.params.id })
    ]);
    if (otherDonor || otherNgo) return res.status(409).json({ message: 'This legacy location is shared by multiple accounts. Ask an administrator to separate the facility records before correcting coordinates.' });
    const location = await Location.findByIdAndUpdate(req.params.id,
      { $set: { latitude: req.body.latitude, longitude: req.body.longitude } },
      { new: true, runValidators: true });
    if (!location) return res.status(404).json({ message: 'Facility location not found.' });
    res.json(location);
  } catch (error) { next(error); }
});

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
