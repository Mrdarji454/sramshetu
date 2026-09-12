import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['user', 'worker', 'cooperative', 'admin'])
      .withMessage('Invalid role specified'),
    validate,
  ],
  authController.register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  [
    body('identifier').trim().notEmpty().withMessage('Phone or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  authController.login
);

// GET /api/v1/auth/me (Protected)
router.get('/me', authenticate, authController.getMe);

export default router;

