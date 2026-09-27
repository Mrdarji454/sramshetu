import { publicBooking } from '../services/bookingVerification.service.js';
import { safelyNotify, notifyAdmins, notifyCooperative } from '../services/notification.service.js';
import { CooperativeService } from '../services/cooperative.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { getCooperativeZoneShiftSuggestions } from '../services/zoneShift.service.js';

export const getProfile = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.cooperativeId || req.user._id || req.user.id;
  const profile = await CooperativeService.getProfile(cooperativeId);
  return successResponse(res, profile, 'Cooperative profile retrieved', 200);
});

export const saveOnboarding = asyncHandler(async (req, res) => {
  const userId = req.user.cooperativeId || req.user._id || req.user.id;
  const updated = await CooperativeService.saveOnboarding(userId, req.body);
  await safelyNotify(() => notifyAdmins({ type: 'VERIFICATION_PENDING', title: 'Cooperative verification pending', message: 'A cooperative profile has been submitted for review.', eventKey: `cooperative-onboarding:${updated._id}` }));
  return successResponse(res, updated, 'Cooperative onboarding saved successfully', 200);
});

export const getVerificationStatus = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.cooperativeId || req.user._id || req.user.id;
  const status = await CooperativeService.getVerificationStatus(cooperativeId);
  return successResponse(res, status, 'Cooperative verification status retrieved', 200);
});

export const getCooperativesList = asyncHandler(async (req, res) => {
  const cooperatives = await CooperativeService.getCooperativesList();
  return successResponse(res, cooperatives, 'Cooperatives list retrieved', 200);
});

export const getMembers = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.cooperativeId || req.user._id || req.user.id;
  const members = await CooperativeService.getMembers(cooperativeId);
  return successResponse(res, members, 'Cooperative members retrieved', 200);
});

export const addMember = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.cooperativeId || req.user._id || req.user.id;
  const member = await CooperativeService.addMember(cooperativeId, req.body);
  await safelyNotify(() => notifyCooperative(cooperativeId, { type: 'WORKER_JOINED', title: 'New worker joined', message: `${member.name || 'A worker'} joined your cooperative.`, eventKey: `member:${cooperativeId}:${member._id || member.id}` }));
  return successResponse(res, member, 'Member artisan enrolled successfully', 201);
});

export const removeMember = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.cooperativeId || req.user._id || req.user.id;
  const { memberId } = req.params;
  const result = await CooperativeService.removeMember(cooperativeId, memberId);
  return successResponse(res, result, 'Member removed from cooperative roster', 200);
});

export const getIncomingRequests = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.cooperativeId || req.user._id || req.user.id;
  const requests = await CooperativeService.getIncomingRequests(cooperativeId);
  return successResponse(res, requests.map(publicBooking), 'Incoming work requests retrieved', 200);
});

export const assignWorker = asyncHandler(async (req, res) => {
  const cooperativeUserId = req.user.cooperativeId || req.user._id || req.user.id;
  const role = req.user.role || 'COOPERATIVE';
  const { bookingId, workerId } = req.body;
  const assignment = await CooperativeService.assignWorker(bookingId, workerId, cooperativeUserId, role);
  return successResponse(res, assignment, 'Worker assigned successfully', 200);
});

export const getZoneShiftSuggestions = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.cooperativeId || req.user._id || req.user.id;
  const suggestions = await getCooperativeZoneShiftSuggestions(cooperativeId);
  return successResponse(res, suggestions, 'Zone shift suggestions retrieved', 200);
});
