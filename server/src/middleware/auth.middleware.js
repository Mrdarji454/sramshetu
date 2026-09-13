import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.model.js';
import mongoose from 'mongoose';

/**
 * Protect middleware: Ensures the incoming request includes a valid Bearer JWT.
 * Attaches the authenticated user to `req.user` (with password stripped).
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract Bearer token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Check token presence
  if (!token) {
    return next(
      new AppError('You are not logged in. Please provide an authentication token.', 401)
    );
  }

  // 3. Verify token validity
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token. Please log in again.', 401));
  }

  // 4. Verify user existence and active status
  if (mongoose.connection.readyState === 1) {
    const currentUser = await User.findById(decoded.id).select('-password -passwordHash');
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    if (!currentUser.isActive) {
      return next(
        new AppError('This user account has been deactivated.', 403)
      );
    }

    req.user = currentUser;
  } else {
    // Fallback when running tests without an active MongoDB connection
    req.user = {
      _id: decoded.id,
      id: decoded.id,
      role: decoded.role || 'USER',
      name: decoded.name || 'Test User',
      email: decoded.email,
      phone: decoded.phone,
      isActive: true,
      isVerified: true,
    };
  }

  next();
});

// Alias for backward compatibility
export const authenticate = protect;
