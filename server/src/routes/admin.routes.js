import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Only admin role can access these routes
router.use(authenticate, authorizeRoles('admin'));

// GET /api/v1/admin/stats
router.get('/stats', adminController.getSystemStats);

// GET /api/v1/admin/verifications
router.get('/verifications', adminController.getVerificationRequests);

// GET /api/v1/admin/complaints
router.get('/complaints', adminController.getComplaints);

export default router;

