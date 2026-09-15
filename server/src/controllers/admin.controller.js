import { AdminService } from '../services/admin.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getSystemStats = asyncHandler(async (req, res) => {
  const stats = await AdminService.getSystemStats();
  return successResponse(res, stats, 'System statistics retrieved', 200);
});

export const getVerificationRequests = asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const requests = await AdminService.getVerificationRequests({ status, type });
  return successResponse(res, requests, 'Verification requests retrieved', 200);
});

export const reviewVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { applicantType, applicantId, status, remarks, aadhaarVerified, nsdcCertified } = req.body;
  const targetId = id || applicantId;
  const result = await AdminService.reviewVerification({
    applicantType,
    applicantId: targetId,
    status,
    remarks,
    aadhaarVerified,
    nsdcCertified,
  });
  return successResponse(res, result, `Applicant ${status === 'verified' ? 'verified' : 'rejected'} successfully`, 200);
});

export const getComplaints = asyncHandler(async (req, res) => {
  const complaints = await AdminService.getComplaints();
  return successResponse(res, complaints, 'Grievance complaints retrieved', 200);
});
