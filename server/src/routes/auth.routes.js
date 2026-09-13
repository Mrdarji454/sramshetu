import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const validRoles = [
  'USER',
  'COOPERATIVE',
  'WORKER',
  'ADMIN',
  'user',
  'cooperative',
  'worker',
  'admin',
  'customer',
];

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required'),
    body('email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .custom((value) => {
        if (!validRoles.includes(value)) {
          throw new Error('Invalid role specified. Allowed: USER, COOPERATIVE, WORKER, ADMIN');
        }
        return true;
      }),
    validate,
  ],
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body().custom((body) => {
      const id = body.identifier || body.phone || body.email;
      if (!id || typeof id !== 'string' || !id.trim()) {
        throw new Error('Please provide identifier, phone number, or email');
      }
      return true;
    }),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate,
  ],
  authController.login
);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me (Protected route)
router.get('/me', protect, authController.getMe);

export default router;
