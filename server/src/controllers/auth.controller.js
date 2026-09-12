import { AuthService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const register = asyncHandler(async (req, res) => {
  const { name, phone, email, password, role } = req.body;
  const result = await AuthService.register({ name, phone, email, password, role });

  return successResponse(res, result, 'User registered successfully', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const result = await AuthService.login({ identifier, password });

  return successResponse(res, result, 'Login successful', 200);
});

export const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, req.user, 'Current user profile retrieved', 200);
});

