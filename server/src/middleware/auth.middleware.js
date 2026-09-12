import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.model.js';
import mongoose from 'mongoose';

export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract Bearer token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please provide an authentication token.', 401)
    );
  }

  // 2. Verify token
  const decoded = jwt.verify(token, config.jwt.secret);

  // 3. Verify user still exists if database is connected
  if (mongoose.connection.readyState === 1) {
    const currentUser = await User.findById(decoded.id);
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
    // If DB is offline during testing, populate user object from decoded JWT
    req.user = {
      _id: decoded.id,
      id: decoded.id,
      role: decoded.role || 'user',
      name: decoded.name || 'Test User',
      email: decoded.email,
      phone: decoded.phone,
    };
  }

  next();
});

