import { AuthService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Register a new user (Customer/User, Worker, Cooperative, Admin)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, phone, email, password, role } = req.body;
  const result = await AuthService.register({ name, phone, email, password, role });

  return successResponse(res, result, 'User registered successfully', 201);
});

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { identifier, phone, email, password } = req.body;
  // Support identifier, phone, or email in body
  const loginIdentifier = identifier || phone || email;

  const result = await AuthService.login({ identifier: loginIdentifier, password });

  return successResponse(res, result, 'Login successful', 200);
});

/**
 * @desc    Logout user and clear auth cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return successResponse(res, null, 'Logged out successfully', 200);
});

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private (protect)
 */
export const getMe = asyncHandler(async (req, res) => {
  // Ensure password fields are stripped
  const safeUser = req.user.toObject ? req.user.toObject() : { ...req.user };
  delete safeUser.password;
  delete safeUser.passwordHash;
  delete safeUser.__v;

  return successResponse(res, { user: safeUser }, 'Current user profile retrieved', 200);
});
