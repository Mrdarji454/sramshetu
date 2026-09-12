/**
 * Async Error Handling Wrapper
 * Wraps an async route handler or middleware to catch any rejected promises
 * and pass them automatically to the next() error handling middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

