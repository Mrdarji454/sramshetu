import { CooperativeService } from '../services/cooperative.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getMembers = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.cooperativeId || req.params.cooperativeId;
  const members = await CooperativeService.getMembers(cooperativeId);
  return successResponse(res, members, 'Cooperative members retrieved', 200);
});

export const getIncomingRequests = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.cooperativeId || req.params.cooperativeId;
  const requests = await CooperativeService.getIncomingRequests(cooperativeId);
  return successResponse(res, requests, 'Incoming work requests retrieved', 200);
});

export const assignWorker = asyncHandler(async (req, res) => {
  const { bookingId, workerId } = req.body;
  const assignment = await CooperativeService.assignWorker(bookingId, workerId);
  return successResponse(res, assignment, 'Worker assigned successfully', 200);
});

