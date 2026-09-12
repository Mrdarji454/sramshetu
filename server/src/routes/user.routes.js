import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Apply authentication to all user routes
router.use(authenticate);

// GET /api/v1/users/profile
router.get('/profile', authorizeRoles('user', 'admin'), userController.getProfile);

// GET /api/v1/users/bookings
router.get('/bookings', authorizeRoles('user', 'admin'), userController.getBookings);

export default router;

