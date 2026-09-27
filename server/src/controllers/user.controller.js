import { UserService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { EmailVerificationService } from '../services/emailVerification.service.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await UserService.getProfile(req.user._id || req.user.id);
  return successResponse(res, profile, 'User profile retrieved', 200);
});

export const getBookings = asyncHandler(async (req, res) => {
  const bookings = await UserService.getBookings(req.user._id || req.user.id);
  return successResponse(res, bookings, 'User bookings retrieved', 200);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await UserService.updateProfile(req.user._id || req.user.id, req.body);
  return successResponse(res, profile, 'Profile updated', 200);
});

export const verifyCurrentPhone = asyncHandler(async (req, res) => {
  const profile = await UserService.verifyCurrentPhone(req.user._id || req.user.id);
  return successResponse(res, profile, 'Phone number verified', 200);
});

export const requestEmailVerification = asyncHandler(async (req, res) => {
  const result = await EmailVerificationService.request(req.user._id || req.user.id, req.body.email);
  return successResponse(res, result, 'Email verification code sent', 200);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await EmailVerificationService.verify(req.user._id || req.user.id, req.body.email, req.body.code);
  return successResponse(res, result, 'Email address verified', 200);
});

export const addAddress = asyncHandler(async (req, res) => {
  const address = await UserService.addAddress(req.user._id || req.user.id, req.body);
  return successResponse(res, address, 'Address saved', 201);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await UserService.updateAddress(req.user._id || req.user.id, req.params.addressId, req.body);
  return successResponse(res, address, 'Address updated', 200);
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const addresses = await UserService.deleteAddress(req.user._id || req.user.id, req.params.addressId);
  return successResponse(res, addresses, 'Address deleted', 200);
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const addresses = await UserService.setDefaultAddress(req.user._id || req.user.id, req.params.addressId);
  return successResponse(res, addresses, 'Default address updated', 200);
});

export const getVault = asyncHandler(async (req, res) => {
  const vault = await UserService.getVault(req.user._id || req.user.id);
  return successResponse(res, vault, 'Vault retrieved', 200);
});

export const changePassword = asyncHandler(async (req, res) => {
  await UserService.changePassword(req.user._id || req.user.id, req.body.currentPassword, req.body.newPassword);
  return successResponse(res, { changed: true }, 'Password updated', 200);
});

