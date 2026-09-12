import { AdminService } from '../services/admin.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getSystemStats = asyncHandler(async (req, res) => {
  const stats = await AdminService.getSystemStats();
  return successResponse(res, stats, 'System statistics retrieved', 200);
});

export const getVerificationRequests = asyncHandler(async (req, res) => {
  const requests = await AdminService.getVerificationRequests();
  return successResponse(res, requests, 'Pending verification requests retrieved', 200);
});

export const getComplaints = asyncHandler(async (req, res) => {
  const complaints = await AdminService.getComplaints();
  return successResponse(res, complaints, 'Grievance complaints retrieved', 200);
});

