import { workerProfile } from '../controllers/directory.controller.js';
import { Router } from 'express';
import { body } from 'express-validator';
import * as workerController from '../controllers/worker.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();
router.get('/public/:id', workerProfile);

// Protect all worker routes
router.use(authenticate, authorizeRoles('worker', 'admin'));

// GET /api/v1/workers/profile
router.get('/profile', workerController.getProfile);

// GET /api/v1/workers/zone-shift-offers
router.get('/zone-shift-offers', workerController.getZoneShiftOffer);

// POST /api/v1/workers/zone-shift/decision
router.post(
  '/zone-shift/decision',
  [body('decision').isIn(['accept', 'decline']).withMessage('Decision must be accept or decline'), validate],
  workerController.respondZoneShift
);

// PATCH /api/v1/workers/profile — update editable fields (bio, phone, workingRadiusKm)
router.patch(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1 to 100 characters'),
    body('email').optional().trim().isEmail().withMessage('Enter a valid email address'),
    body('profileImage').optional({ nullable: true }).isString().isLength({ max: 7000000 }),
    body('profession').optional().isString().isLength({ max: 100 }),
    body('bio').optional().isString().isLength({ max: 2000 }).withMessage('Bio must be 2000 characters or fewer'),
    body('phone').optional().trim(),
    body('workingRadiusKm')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Working radius must be an integer between 1 and 100 km'),
    body('skills').optional().isArray().withMessage('Skills must be a list'),
    body('address').optional().isObject().withMessage('Address must be an object'),
    body('generatedDocuments').optional().isArray().withMessage('Generated documents must be a list'),
    validate,
  ],
  workerController.updateProfile
);

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
    body('workingDays').optional().isArray().withMessage('Working days must be a list'),
    body('hours').optional().isObject().withMessage('Working hours must be an object'),
    validate,
  ],
  workerController.updateAvailability
);

// GET /api/v1/workers/assigned-jobs
router.get('/assigned-jobs', workerController.getAssignedJobs);

// GET /api/v1/workers/registration-status
router.get('/registration-status', workerController.getRegistrationStatus);

// POST /api/v1/workers/step/:stepNumber
router.post('/step/:stepNumber', workerController.saveStep);

// POST /api/v1/workers/submit-registration
router.post('/submit-registration', workerController.submitRegistration);

export default router;
