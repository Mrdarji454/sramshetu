import { AppError } from '../utils/AppError.js';

/**
 * Role-Based Authorization Middleware
 * Restricts route access to specific ShramSetu roles.
 * Supported roles: 'user', 'worker', 'cooperative', 'admin'
 *
 * @param  {...string} allowedRoles - Array of authorized roles
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(
        new AppError('User role not identified. Authentication required.', 401)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role "${req.user.role}" does not have permission to access this resource. Allowed roles: [${allowedRoles.join(
            ', '
          )}]`,
          403
        )
      );
    }

    next();
  };
}

