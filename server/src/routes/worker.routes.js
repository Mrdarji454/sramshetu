import { Router } from 'express';
import { body } from 'express-validator';
import * as workerController from '../controllers/worker.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// Protect all worker routes
router.use(authenticate, authorizeRoles('worker', 'admin'));

// GET /api/v1/workers/profile
router.get('/profile', workerController.getProfile);

// POST /api/v1/workers/onboarding & PUT /api/v1/workers/profile
router.post(
  '/onboarding',
  [
    body('primaryTrade').optional().trim(),
    body('years').optional().isNumeric().withMessage('Years of experience must be a number'),
    validate,
  ],
  workerController.saveOnboarding
);
router.put('/profile', workerController.saveOnboarding);

// GET /api/v1/workers/verification-status
router.get('/verification-status', workerController.getVerificationStatus);

// POST /api/v1/workers/documents
router.post(
  '/documents',
  [
    body('docType').notEmpty().withMessage('Document type is required'),
    body('url').notEmpty().withMessage('Document URL / Data is required'),
    validate,
  ],
  workerController.uploadDocument
);

// PATCH /api/v1/workers/availability
router.patch(
  '/availability',
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
router.get('/assigned-jobs', workerController.getAssignedJobs);

export default router;
