import { Worker, WorkerProfile } from '../models/WorkerProfile.model.js';
import { Cooperative } from '../models/Cooperative.model.js';
import { inMemoryWorkers } from './worker.service.js';
import { inMemoryCooperatives } from './cooperative.service.js';
import {
  calculateDistance,
  isWithinRadius,
  estimateTravelTime,
  formatDistance,
} from '../utils/geo.utils.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export class MatchingService {
  /**
   * Location-based hierarchical matching:
   * Customer Location -> Nearby Cooperatives -> Nearby Workers
   * 
   * @param {object} params
   * @param {number} params.latitude - Customer latitude
   * @param {number} params.longitude - Customer longitude
   * @param {string} [params.skill] - Filter by skill name or trade keyword
   * @param {string} [params.trade] - Filter by service/trade
   * @param {boolean} [params.availableOnly=true] - Filter only workers currently available
   * @param {number} [params.maxRadiusKm=25] - Maximum search radius
   * @param {string} [params.sortBy='distance'] - 'distance' | 'rating' | 'experience'
   */
  static async findNearbyMatches({
    latitude,
    longitude,
    skill,
    trade,
    availableOnly = true,
    maxRadiusKm = 30,
    sortBy = 'distance',
  }) {
    const custLat = Number(latitude);
    const custLng = Number(longitude);

    if (isNaN(custLat) || isNaN(custLng)) {
      throw new AppError('Valid customer latitude and longitude are required for location matching', 400);
    }

    const targetQuery = (trade || skill || '').trim().toLowerCase();
    const maxRadius = Math.min(100, Math.max(1, Number(maxRadiusKm) || 30));

    // -------------------------------------------------------------
    // Step 1: Discover and Rank Nearby Registered Cooperatives
    // -------------------------------------------------------------
    let allCooperatives = [];
    if (mongoose.connection.readyState === 1) {
      allCooperatives = await Cooperative.find({ verificationStatus: 'verified' }).lean();
    } else {
      allCooperatives = Array.from(inMemoryCooperatives.values());
    }

    const nearbyCooperatives = allCooperatives
      .map((coop) => {
        const coopLat = Number(coop.latitude || coop.location?.latitude || coop.location?.coordinates?.[1] || 18.5204);
        const coopLng = Number(coop.longitude || coop.location?.longitude || coop.location?.coordinates?.[0] || 73.8436);
        const dist = calculateDistance(custLat, custLng, coopLat, coopLng);
        const coopRadius = Number(coop.serviceArea?.radiusKm || 25);

        return {
          id: coop.id || coop._id,
          _id: coop.id || coop._id,
          name: coop.name,
          registrationNumber: coop.registrationDetails?.registrationNumber || 'N/A',
          trustScore: Number(coop.trustScore || 96.5),
          serviceCategories: coop.serviceCategories || [],
          distance: dist,
          distanceFormatted: formatDistance(dist),
          estimatedArrivalMin: estimateTravelTime(dist),
          isWithinServiceArea: dist <= coopRadius,
          coverageRadiusKm: coopRadius,
          district: coop.location?.district || coop.district || 'Pune',
          state: coop.location?.state || coop.state || 'Maharashtra',
          memberCount: coop.members?.length || 20,
          coordinates: {
            latitude: coopLat,
            longitude: coopLng,
          },
        };
      })
      // Filter within cooperative coverage or within customer search radius
      .filter((c) => c.distance <= Math.max(c.coverageRadiusKm, maxRadius))
      .sort((a, b) => a.distance - b.distance);

    // Build cooperative map for fast lookup
    const coopMap = new Map();
    for (const c of nearbyCooperatives) {
      coopMap.set(String(c.id), c);
      coopMap.set(String(c._id), c);
    }

    // -------------------------------------------------------------
    // Step 2: Discover, Filter & Rank Nearby Available Artisans
    // -------------------------------------------------------------
    let allWorkers = [];
    if (mongoose.connection.readyState === 1) {
      allWorkers = await Worker.find({
        'verificationStatus.status': { $in: ['verified', 'pending'] },
      }).lean();
    } else {
      allWorkers = Array.from(inMemoryWorkers.values());
    }

    const qualifiedMatches = [];

    for (const worker of allWorkers) {
      // 1. Trade & Skill Filtering
      const workerTrade = (worker.trade || worker.experience?.primaryTrade || '').toLowerCase();
      const subTrades = (worker.experience?.subTrades || []).map((t) => String(t).toLowerCase());
      const skillNames = (worker.skills || []).map((s) => (typeof s === 'string' ? s : s.name || '').toLowerCase());

      if (targetQuery) {
        const tradeMatches =
          workerTrade.includes(targetQuery) ||
          targetQuery.includes(workerTrade) ||
          subTrades.some((st) => st.includes(targetQuery) || targetQuery.includes(st)) ||
          skillNames.some((sk) => sk.includes(targetQuery) || targetQuery.includes(sk));

        if (!tradeMatches) {
          continue;
        }
      }

      // 2. Availability Filtering
      const availabilityStatus = (worker.availability?.status || 'available').toLowerCase();
      if (availableOnly && availabilityStatus !== 'available') {
        continue;
      }

      // 3. Approximate Distance Calculation
      const workerLat = Number(worker.latitude || worker.location?.latitude || worker.location?.coordinates?.[1] || 18.5204);
      const workerLng = Number(worker.longitude || worker.location?.longitude || worker.location?.coordinates?.[0] || 73.8567);
      const dist = calculateDistance(custLat, custLng, workerLat, workerLng);

      // 4. Service Area & Radius Constraint
      const workerServiceRadius = Number(
        worker.serviceArea?.radiusKm || worker.location?.workingRadiusKm || 15
      );
      const effectiveRadius = Math.max(workerServiceRadius, maxRadius);
      if (dist > effectiveRadius) {
        continue;
      }

      // 5. Associated Cooperative resolution
      const coopId = worker.cooperativeId || worker.cooperative || '';
      const associatedCoop = coopMap.get(String(coopId)) || nearbyCooperatives[0] || {
        id: 'COOP-PUN-01',
        name: 'Pune Shramik Vikas Sahakari',
        trustScore: 98.4,
        district: 'Pune',
        state: 'Maharashtra',
        distance: dist + 0.5,
        distanceFormatted: formatDistance(dist + 0.5),
      };

      // 6. Multi-Factor Ranking Score
      // Proximity (0-50 pts) + Rating (0-30 pts) + Verified (0-10 pts) + Experience (0-10 pts)
      const proximityScore = Math.max(0, 50 - dist * 2);
      const ratingScore = ((Number(worker.rating?.average || worker.rating) || 4.5) / 5) * 30;
      const verifiedScore = (worker.verificationStatus?.status === 'verified' || worker.isVerified) ? 10 : 5;
      const experienceScore = Math.min(10, (Number(worker.experience?.years) || 0) * 1.5);
      const matchScore = Math.round((proximityScore + ratingScore + verifiedScore + experienceScore) * 10) / 10;

      // Extract skills list
      const skillsList = (worker.skills || []).map((s) => (typeof s === 'string' ? s : s.name));

      qualifiedMatches.push({
        // Worker object
        worker: {
          id: worker.id || worker._id,
          _id: worker.id || worker._id,
          name: worker.name || 'Artisan Tradesperson',
          phone: worker.phone || '+91 98000 00000',
          trade: worker.trade || worker.experience?.primaryTrade || 'General Technical',
          primaryTrade: worker.experience?.primaryTrade || worker.trade || 'General Technical',
          subTrades: worker.experience?.subTrades || [],
          bio: worker.experience?.bio || '',
          avatar: worker.profileImage || null,
          experienceYears: worker.experience?.years || 0,
          rates: worker.rates || { dailyFloorRate: 800, hourlyRate: 250, currency: 'INR' },
          isVerified: Boolean(worker.verificationStatus?.status === 'verified' || worker.isVerified),
          aadhaarVerified: Boolean(worker.verificationStatus?.aadhaarVerified || worker.aadhaarVerified),
          nsdcCertified: Boolean(worker.verificationStatus?.nsdcCertified || worker.nsdcCertified),
          jobsCompleted: worker.jobsCompleted || 120,
        },
        // Skills
        skills: skillsList.length > 0 ? skillsList : [worker.trade || 'Specialized Artisan'],
        // Rating
        rating: Number((worker.rating?.average || worker.rating || 4.9).toFixed(2)),
        ratingCount: worker.rating?.count || worker.rating?.totalReviews || 45,
        // Distance
        distance: dist,
        distanceFormatted: formatDistance(dist),
        estimatedArrivalMin: estimateTravelTime(dist),
        // Availability
        availability: {
          status: worker.availability?.status || 'available',
          workingDays: worker.availability?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          hours: worker.availability?.hours || { start: '08:00', end: '18:00' },
        },
        // Cooperative
        cooperative: {
          id: associatedCoop.id || associatedCoop._id,
          name: associatedCoop.name,
          trustScore: associatedCoop.trustScore,
          district: associatedCoop.district,
          state: associatedCoop.state,
          distance: associatedCoop.distance,
          distanceFormatted: associatedCoop.distanceFormatted,
        },
        // Coordinates for Map
        coordinates: {
          latitude: workerLat,
          longitude: workerLng,
        },
        // Ranking score
        matchScore,
      });
    }

    // -------------------------------------------------------------
    // Step 3: Sort Ranked Results
    // -------------------------------------------------------------
    if (sortBy === 'rating') {
      qualifiedMatches.sort((a, b) => b.rating - a.rating || a.distance - b.distance);
    } else if (sortBy === 'experience') {
      qualifiedMatches.sort((a, b) => b.worker.experienceYears - a.worker.experienceYears || a.distance - b.distance);
    } else if (sortBy === 'score') {
      qualifiedMatches.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      // Default: Proximity (nearest distance first)
      qualifiedMatches.sort((a, b) => a.distance - b.distance || b.rating - a.rating);
    }

    return {
      customerLocation: {
        latitude: custLat,
        longitude: custLng,
      },
      searchFilters: {
        skill: skill || null,
        trade: trade || null,
        availableOnly,
        maxRadiusKm: maxRadius,
        sortBy,
      },
      cooperatives: nearbyCooperatives,
      workers: qualifiedMatches,
      totalMatches: qualifiedMatches.length,
    };
  }

  /**
   * Get cooperatives within proximity of coordinates
   */
  static async getNearbyCooperatives({ latitude, longitude, radiusKm = 30 }) {
    const custLat = Number(latitude);
    const custLng = Number(longitude);
    const maxRadius = Math.min(100, Math.max(1, Number(radiusKm) || 30));

    if (isNaN(custLat) || isNaN(custLng)) {
      throw new AppError('Valid latitude and longitude are required', 400);
    }

    let allCooperatives = [];
    if (mongoose.connection.readyState === 1) {
      allCooperatives = await Cooperative.find({ verificationStatus: 'verified' }).lean();
    } else {
      allCooperatives = Array.from(inMemoryCooperatives.values());
    }

    return allCooperatives
      .map((coop) => {
        const coopLat = Number(coop.latitude || coop.location?.latitude || coop.location?.coordinates?.[1] || 18.5204);
        const coopLng = Number(coop.longitude || coop.location?.longitude || coop.location?.coordinates?.[0] || 73.8436);
        const dist = calculateDistance(custLat, custLng, coopLat, coopLng);
        return {
          id: coop.id || coop._id,
          name: coop.name,
          registrationNumber: coop.registrationDetails?.registrationNumber || 'N/A',
          trustScore: Number(coop.trustScore || 96.5),
          serviceCategories: coop.serviceCategories || [],
          distance: dist,
          distanceFormatted: formatDistance(dist),
          district: coop.location?.district || coop.district || 'Pune',
          state: coop.location?.state || coop.state || 'Maharashtra',
          memberCount: coop.members?.length || 20,
          coordinates: { latitude: coopLat, longitude: coopLng },
        };
      })
      .filter((c) => c.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance);
  }
}

