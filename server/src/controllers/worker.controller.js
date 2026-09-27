import { publicBooking } from '../services/bookingVerification.service.js';
import { safelyNotify, notifyAdmins, notifyCooperative } from '../services/notification.service.js';
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
  if (updated.cooperativeId || updated.cooperative) await safelyNotify(() => notifyCooperative(updated.cooperativeId || updated.cooperative, { type: 'WORKER_JOINED', title: 'New worker joined', message: 'A worker selected your cooperative during onboarding.', eventKey: `joined:${userId}:${updated.cooperativeId?._id || updated.cooperativeId || updated.cooperative?._id || updated.cooperative}` }));
  await safelyNotify(() => notifyAdmins({ type: 'VERIFICATION_PENDING', title: 'Worker verification pending', message: 'A worker profile has been submitted for review.', eventKey: `worker-onboarding:${userId}` }));
  return successResponse(res, updated, 'Worker onboarding saved successfully', 200);
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { status, workingRadiusKm } = req.body;
  const previous = await WorkerService.getProfile(userId);
  const previousStatus = previous.availability?.status;
  const updated = await WorkerService.updateAvailability(userId, {
    status,
    workingRadiusKm,
  });
  if (status && status !== 'available' && status !== previousStatus) await safelyNotify(() => notifyCooperative(updated.cooperativeId || updated.cooperative, { type: 'WORKER_UNAVAILABLE', title: 'Worker became unavailable', message: `${updated.name || 'A member worker'} is now ${status}.` }));
  return successResponse(res, updated, 'Availability updated successfully', 200);
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { docType, url, name } = req.body;
  // Validate document
  const validated = WorkerService.validateDocumentUpload({ docType, url, name });
  const documents = await WorkerService.uploadDocument(userId, validated);
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
  return successResponse(res, jobs.map(publicBooking), 'Assigned jobs retrieved', 200);
});

/**
 * Requirement 10 & 11: Registration Status & Progress
 * GET /api/v1/workers/registration-status
 */
export const getRegistrationStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const status = await WorkerService.getRegistrationStatus(userId);
  return successResponse(res, status, 'Registration status retrieved', 200);
});

/**
 * Requirement 11: Save and validate specific registration step
 * POST /api/v1/workers/step/:stepNumber
 */
export const saveStep = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { stepNumber } = req.params;
  const result = await WorkerService.saveStep(userId, stepNumber, req.body);
  if (String(stepNumber) === '3' && req.body.cooperativeId) await safelyNotify(() => notifyCooperative(req.body.cooperativeId, { type: 'WORKER_JOINED', title: 'New worker joined', message: 'A worker selected your cooperative during registration.', eventKey: `joined:${userId}:${req.body.cooperativeId}` }));
  return successResponse(res, result, `Step ${stepNumber} saved successfully`, 200);
});

/**
 * Requirement 10: Final registration submission
 * POST /api/v1/workers/submit-registration
 */
export const submitRegistration = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const result = await WorkerService.submitRegistration(userId);
  await safelyNotify(() => notifyAdmins({ type: 'VERIFICATION_PENDING', title: 'Worker verification pending', message: 'A worker registration is ready for review.' }));
  return successResponse(res, result, result.message, 200);
});

/**
 * Update editable worker profile fields (bio, phone, workingRadiusKm)
 * PATCH /api/v1/workers/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { bio, phone, workingRadiusKm } = req.body;
  const updated = await WorkerService.updateProfile(userId, { bio, phone, workingRadiusKm });
  return successResponse(res, updated, 'Profile updated successfully', 200);
});
