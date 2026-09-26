import mongoose from 'mongoose';
import { Worker } from '../models/Worker.model.js';
import { Cooperative } from '../models/Cooperative.model.js';
import { Review } from '../models/Review.model.js';
import { Booking } from '../models/Booking.model.js';
import { inMemoryWorkers } from '../services/worker.service.js';
import { inMemoryCooperatives } from '../services/cooperative.service.js';
import { memoryReviews } from '../services/review.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

const idOf = value => String(value?._id || value || '');
const findMemory = (store, id) => [...store.values()].find(item => idOf(item._id || item.id) === id);
export function workerPublic(w, cooperative = null) {
  return {
    id: idOf(w._id || w.id), name: w.user?.name || w.name || 'Artisan',
    avatar: w.user?.profileImage || w.profileImage || null,
    primaryTrade: w.experience?.primaryTrade || w.trade, trade: w.experience?.primaryTrade || w.trade,
    skills: (w.skills || []).map(s => typeof s === 'string' ? s : s.name),
    experienceYears: w.experience?.years || 0, bio: w.experience?.bio || '',
    serviceArea: w.serviceArea, serviceRadius: w.serviceRadius || w.serviceArea?.radiusKm || w.location?.workingRadiusKm || 15,
    coordinates: { latitude: w.location?.coordinates?.[1] ?? w.latitude, longitude: w.location?.coordinates?.[0] ?? w.longitude },
    jobsCompleted: w.jobsCompleted || 0, rating: w.rating?.average || 0, ratingCount: w.rating?.count || 0,
    availability: w.availability, rates: w.rates,
    isVerified: w.verificationStatus?.status === 'verified',
    cooperative: cooperative ? { id: idOf(cooperative._id || cooperative.id), name: cooperative.name } : null,
  };
}
export const workerProfile = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const connected = mongoose.connection.readyState === 1;
  const w = connected && mongoose.isValidObjectId(id) ? await Worker.findById(id).populate('user', 'name profileImage').lean() : !connected ? findMemory(inMemoryWorkers, id) : null;
  if (!w) throw new AppError('Worker not found', 404);
  const coopId = idOf(w.cooperative || w.cooperativeId);
  const coop = connected && mongoose.isValidObjectId(coopId) ? await Cooperative.findById(coopId).select('name').lean() : findMemory(inMemoryCooperatives, coopId);
  const reviews = connected ? await Review.find({ worker: w._id, isPublic: true }).select('rating feedback comment tags createdAt').sort({ createdAt: -1 }).limit(20).lean() : [...memoryReviews.values()].filter(r => idOf(r.worker) === id).map(({ rating, feedback, tags, createdAt }) => ({ rating, feedback, tags, createdAt }));
  return successResponse(res, { ...workerPublic(w, coop), reviews });
});
export const cooperativeProfile = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const connected = mongoose.connection.readyState === 1;
  const c = connected && mongoose.isValidObjectId(id) ? await Cooperative.findById(id).lean() : !connected ? findMemory(inMemoryCooperatives, id) : null;
  if (!c) throw new AppError('Cooperative not found', 404);
  const workers = connected ? await Worker.find({ cooperative: c._id }).populate('user', 'name profileImage').limit(50).lean() : [...inMemoryWorkers.values()].filter(w => idOf(w.cooperative || w.cooperativeId) === id);
  const completedJobs = connected ? await Booking.countDocuments({ cooperative: c._id, status: { $in: ['COMPLETED', 'completed'] } }) : workers.reduce((sum, w) => sum + (w.jobsCompleted || 0), 0);
  return successResponse(res, { id, name: c.name, description: c.description, logo: c.metadata?.logo,
    verificationStatus: c.verificationStatus, registrationNumber: c.registrationDetails?.registrationNumber,
    memberCount: c.members?.length || workers.length, serviceCategories: c.serviceCategories || [],
    district: c.location?.district, state: c.location?.state, serviceArea: c.serviceArea,
    rating: c.rating || { average: 0, count: 0 }, completedJobs,
    coordinates: { latitude: c.location?.coordinates?.[1] ?? c.latitude, longitude: c.location?.coordinates?.[0] ?? c.longitude },
    workers: workers.map(w => workerPublic(w)),
  });
});
