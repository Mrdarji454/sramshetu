import { AppError } from '../utils/AppError.js';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error in development
  if (config.env === 'development') {
    console.error('[Error caught by centralized errorHandler]:', err);
  }

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new AppError(message, 404);
  }

  // 2. Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new AppError(message, 409);
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((val) => val.message);
    const message = `Validation error: ${errors.join(', ')}`;
    error = new AppError(message, 400, errors);
  }

  // 4. JWT Token Invalid Error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token. Please log in again.';
    error = new AppError(message, 401);
  }

  // 5. JWT Token Expired Error
  if (err.name === 'TokenExpiredError') {
    const message = 'Your authentication token has expired. Please log in again.';
    error = new AppError(message, 401);
  }

  // Send structured JSON error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    errors: error.errors || null,
    ...(config.env === 'development' && { stack: err.stack }),
  });
}

