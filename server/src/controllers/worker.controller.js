import { WorkerService } from '../services/worker.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const profile = await WorkerService.getProfile(userId);
  return successResponse(res, profile, 'Worker profile retrieved', 200);
});

export const saveOnboarding = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const updated = await WorkerService.saveOnboarding(userId, req.body);
  return successResponse(res, updated, 'Worker onboarding saved successfully', 200);
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { status, workingRadiusKm } = req.body;
  const updated = await WorkerService.updateAvailability(userId, {
    status,
    workingRadiusKm,
  });
  return successResponse(res, updated, 'Availability updated successfully', 200);
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { docType, url, name } = req.body;
  const documents = await WorkerService.uploadDocument(userId, { docType, url, name });
  return successResponse(res, documents, 'Document uploaded successfully', 200);
});

export const getVerificationStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const status = await WorkerService.getVerificationStatus(userId);
  return successResponse(res, status, 'Verification status retrieved', 200);
});

export const getAssignedJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const jobs = await WorkerService.getAssignedJobs(userId);
  return successResponse(res, jobs, 'Assigned jobs retrieved', 200);
});
