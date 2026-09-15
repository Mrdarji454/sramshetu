import { Router } from 'express';
import { body } from 'express-validator';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// Only admin role can access these routes
router.use(authenticate, authorizeRoles('admin'));

// GET /api/v1/admin/stats
router.get('/stats', adminController.getSystemStats);

// GET /api/v1/admin/verifications
router.get('/verifications', adminController.getVerificationRequests);

// PATCH /api/v1/admin/verifications/:id/review & POST /api/v1/admin/verifications/review
router.patch(
  '/verifications/:id/review',
  [
    body('status')
      .isIn(['verified', 'rejected'])
      .withMessage('Status must be either "verified" or "rejected"'),
    validate,
  ],
  adminController.reviewVerification
);

router.post(
  '/verifications/review',
  [
    body('applicantType').notEmpty().withMessage('applicantType is required'),
    body('applicantId').notEmpty().withMessage('applicantId is required'),
    body('status')
      .isIn(['verified', 'rejected'])
      .withMessage('Status must be either "verified" or "rejected"'),
    validate,
  ],
  adminController.reviewVerification
);

// GET /api/v1/admin/complaints
router.get('/complaints', adminController.getComplaints);

export default router;
