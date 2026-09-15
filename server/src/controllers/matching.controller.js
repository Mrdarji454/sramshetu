import { MatchingService } from '../services/matching.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Location-based search and ranking for nearby suitable workers & cooperatives
 * GET /api/v1/matching/nearby
 * POST /api/v1/matching/search
 */
export const findNearbyMatches = asyncHandler(async (req, res) => {
  const params = req.method === 'POST' ? req.body : req.query;

  const latitude = params.latitude || params.lat;
  const longitude = params.longitude || params.lng || params.lon;
  const skill = params.skill;
  const trade = params.trade || params.service;
  const availableOnly = params.availableOnly !== undefined
    ? params.availableOnly === true || params.availableOnly === 'true'
    : params.available !== undefined
    ? params.available === true || params.available === 'true'
    : true;
  const maxRadiusKm = params.maxRadiusKm || params.radius || params.radiusKm || 30;
  const sortBy = params.sortBy || params.sort || 'distance';

  const result = await MatchingService.findNearbyMatches({
    latitude,
    longitude,
    skill,
    trade,
    availableOnly,
    maxRadiusKm,
    sortBy,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get nearby cooperatives by customer coordinates
 * GET /api/v1/matching/cooperatives
 */
export const findNearbyCooperatives = asyncHandler(async (req, res) => {
  const latitude = req.query.latitude || req.query.lat;
  const longitude = req.query.longitude || req.query.lng;
  const radiusKm = req.query.radius || req.query.radiusKm || 30;

  const cooperatives = await MatchingService.getNearbyCooperatives({
    latitude,
    longitude,
    radiusKm,
  });

  res.status(200).json({
    success: true,
    data: cooperatives,
  });
});

