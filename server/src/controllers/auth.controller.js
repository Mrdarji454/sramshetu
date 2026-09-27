import { AuthService } from '../services/auth.service.js';
import { OtpService } from '../services/otp.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

/**
 * @desc    Send OTP to mobile number
 * @route   POST /api/auth/otp/send
 * @access  Public
 */
export const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    throw new AppError('Phone number is required to send OTP', 400);
  }
  const result = await OtpService.sendOtp(phone);
  return successResponse(res, result, 'OTP sent successfully', 200);
});

/**
 * @desc    Verify mobile OTP
 * @route   POST /api/auth/otp/verify
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    throw new AppError('Both phone number and OTP are required', 400);
  }
  const result = await OtpService.verifyOtp(phone, otp);
  return successResponse(res, result, 'Mobile OTP verified successfully', 200);
});

/**
 * @desc    Register a new user (Customer/User, Worker, Cooperative, Admin)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, phone, email, password, role } = req.body;

  // Requirement 2: Email is compulsory
  if (!email || !email.trim()) {
    throw new AppError('Email address is required for registration', 400);
  }

  // Requirement 1: Mobile OTP verification required for USER & WORKER
  const normalizedRole = (role || 'USER').toUpperCase();
  const requiresOtp = ['USER', 'CUSTOMER', 'WORKER'].includes(normalizedRole);

  const isVerified = OtpService.isPhoneVerified(phone);
  if (requiresOtp && !isVerified) {
    throw new AppError('Mobile number must be verified via OTP before registration can be completed.', 400);
  }

  const result = await AuthService.register({
    name,
    phone,
    email,
    password,
    role,
    phoneVerified: isVerified,
  });

  // Consume token after successful registration
  OtpService.consumePhoneVerification(phone);

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
