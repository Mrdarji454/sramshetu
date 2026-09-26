import { Router } from 'express';
import { PincodeService } from '../services/pincode.service.js';

const router = Router();

// GET /api/v1/pincode/reverse-geocode?lat=...&lng=...
router.get('/reverse-geocode', async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters lat and lng are required',
      });
    }

    const data = await PincodeService.reverseGeocode(lat, lng);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/pincode/:pincode
router.get('/:pincode', async (req, res, next) => {
  try {
    const { pincode } = req.params;
    const data = await PincodeService.lookup(pincode);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to lookup pincode',
    });
  }
});

export default router;

