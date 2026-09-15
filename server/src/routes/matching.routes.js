import { Router } from 'express';
import * as matchingController from '../controllers/matching.controller.js';

const router = Router();

// Public / Authenticated discovery endpoints for customer location matching
// GET /api/v1/matching/nearby
router.get('/nearby', matchingController.findNearbyMatches);

// POST /api/v1/matching/search
router.post('/search', matchingController.findNearbyMatches);

// GET /api/v1/matching/cooperatives
router.get('/cooperatives', matchingController.findNearbyCooperatives);

export default router;

