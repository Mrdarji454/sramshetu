import { Router } from 'express';
import { body } from 'express-validator';
import * as cooperativeController from '../controllers/cooperative.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/cooperatives/members
router.get(
  '/members',
  authorizeRoles('cooperative', 'admin'),
  cooperativeController.getMembers
);

// GET /api/v1/cooperatives/requests
router.get(
  '/requests',
  authorizeRoles('cooperative', 'admin'),
  cooperativeController.getIncomingRequests
);

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

