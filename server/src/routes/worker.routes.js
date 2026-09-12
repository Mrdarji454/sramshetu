import { Router } from 'express';
import { body } from 'express-validator';
import * as workerController from '../controllers/worker.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/workers/profile
router.get('/profile', authorizeRoles('worker', 'admin'), workerController.getProfile);

// PATCH /api/v1/workers/availability
router.patch(
  '/availability',
  authorizeRoles('worker', 'admin'),
  [
    body('status')
      .optional()
      .isIn(['available', 'busy', 'on_leave', 'offline'])
      .withMessage('Invalid availability status'),
    body('workingRadiusKm')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Radius must be an integer between 1 and 100 km'),
    validate,
  ],
  workerController.updateAvailability
);

// GET /api/v1/workers/assigned-jobs
router.get(
  '/assigned-jobs',
  authorizeRoles('worker', 'admin'),
  workerController.getAssignedJobs
);

export default router;

