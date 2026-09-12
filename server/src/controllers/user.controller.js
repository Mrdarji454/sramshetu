import { UserService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await UserService.getProfile(req.user._id || req.user.id);
  return successResponse(res, profile, 'User profile retrieved', 200);
});

export const getBookings = asyncHandler(async (req, res) => {
  const bookings = await UserService.getBookings(req.user._id || req.user.id);
  return successResponse(res, bookings, 'User bookings retrieved', 200);
});

