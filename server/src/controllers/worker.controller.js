import { WorkerService } from '../services/worker.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await WorkerService.getProfile(req.user._id || req.user.id);
  return successResponse(res, profile, 'Worker profile retrieved', 200);
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const { status, workingRadiusKm } = req.body;
  const updated = await WorkerService.updateAvailability(req.user._id || req.user.id, {
    status,
    workingRadiusKm,
  });
  return successResponse(res, updated, 'Availability updated successfully', 200);
});

export const getAssignedJobs = asyncHandler(async (req, res) => {
  const jobs = await WorkerService.getAssignedJobs(req.user._id || req.user.id);
  return successResponse(res, jobs, 'Assigned jobs retrieved', 200);
});

