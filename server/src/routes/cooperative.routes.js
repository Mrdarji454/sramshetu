import { Router } from 'express';
import { body } from 'express-validator';
import * as cooperativeController from '../controllers/cooperative.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// Public / general directory of cooperatives
router.get('/list', cooperativeController.getCooperativesList);

// Protected routes
router.use(authenticate);

// GET /api/v1/cooperatives/profile
router.get('/profile', authorizeRoles('cooperative', 'admin'), cooperativeController.getProfile);

// POST /api/v1/cooperatives/onboarding & PUT /api/v1/cooperatives/profile
router.post(
  '/onboarding',
  authorizeRoles('cooperative', 'admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Society name cannot be empty'),
    validate,
  ],
  cooperativeController.saveOnboarding
);
router.put('/profile', authorizeRoles('cooperative', 'admin'), cooperativeController.saveOnboarding);

// GET /api/v1/cooperatives/verification-status
router.get('/verification-status', authorizeRoles('cooperative', 'admin'), cooperativeController.getVerificationStatus);

// GET & POST /api/v1/cooperatives/members
router.get('/members', authorizeRoles('cooperative', 'admin'), cooperativeController.getMembers);

router.post(
  '/members',
  authorizeRoles('cooperative', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Member name is required'),
    body('trade').trim().notEmpty().withMessage('Trade is required'),
    validate,
  ],
  cooperativeController.addMember
);

// DELETE /api/v1/cooperatives/members/:memberId
router.delete('/members/:memberId', authorizeRoles('cooperative', 'admin'), cooperativeController.removeMember);

// GET /api/v1/cooperatives/requests
router.get('/requests', authorizeRoles('cooperative', 'admin'), cooperativeController.getIncomingRequests);

// POST /api/v1/cooperatives/assign-worker
router.post(
  '/assign-worker',
  authorizeRoles('cooperative', 'admin'),
  [
    body('bookingId').notEmpty().withMessage('bookingId is required'),
    body('workerId').notEmpty().withMessage('workerId is required'),
    validate,
  ],
  cooperativeController.assignWorker
);

export default router;
