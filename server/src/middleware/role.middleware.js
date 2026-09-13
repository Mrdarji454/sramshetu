import { AppError } from '../utils/AppError.js';

/**
 * Role-Based Authorization Middleware
 * Restricts route access to specific ShramSetu roles.
 * Allowed roles: USER, COOPERATIVE, WORKER, ADMIN
 *
 * @param {...string} allowedRoles - Allowed roles (case-insensitive)
 */
export function authorize(...allowedRoles) {
  // Normalize allowed roles to uppercase for case-insensitive matching
  const normalizedAllowedRoles = allowedRoles.map((role) => {
    const r = role.toUpperCase();
    return r === 'CUSTOMER' ? 'USER' : r;
  });

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(
        new AppError('User role not identified. Authentication required.', 401)
      );
    }

    const currentRole = req.user.role.toUpperCase() === 'CUSTOMER'
      ? 'USER'
      : req.user.role.toUpperCase();

    if (!normalizedAllowedRoles.includes(currentRole)) {
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

// Alias for backward compatibility
export const authorizeRoles = authorize;
