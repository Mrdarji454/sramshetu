import { CooperativeService } from '../services/cooperative.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getProfile = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.cooperativeId || req.user._id || req.user.id;
  const profile = await CooperativeService.getProfile(cooperativeId);
  return successResponse(res, profile, 'Cooperative profile retrieved', 200);
});

export const saveOnboarding = asyncHandler(async (req, res) => {
  const userId = req.user.cooperativeId || req.user._id || req.user.id;
  const updated = await CooperativeService.saveOnboarding(userId, req.body);
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
  return successResponse(res, requests, 'Incoming work requests retrieved', 200);
});

export const assignWorker = asyncHandler(async (req, res) => {
  const { bookingId, workerId } = req.body;
  const assignment = await CooperativeService.assignWorker(bookingId, workerId);
  return successResponse(res, assignment, 'Worker assigned successfully', 200);
});
