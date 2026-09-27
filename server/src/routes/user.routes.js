import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// Apply authentication to all user routes
router.use(authenticate);

// GET /api/v1/users/profile
router.get('/profile', authorizeRoles('user'), userController.getProfile);
router.post('/profile/phone/verify', authorizeRoles('user'), userController.verifyCurrentPhone);
router.post(
    '/profile/email-verification',
    authorizeRoles('user'),
    [body('email').trim().isEmail(), validate],
    userController.requestEmailVerification,
);
router.post(
    '/profile/email-verification/verify',
    authorizeRoles('user'),
    [body('email').trim().isEmail(), body('code').trim().isLength({ min: 6, max: 6 }).isNumeric(), validate],
    userController.verifyEmail,
);
router.patch(
    '/profile',
    authorizeRoles('user'),
    [
        body('name').optional().trim().notEmpty().isLength({ max: 100 }),
        body('email').optional().trim().isEmail(),
        body('phone').optional().trim().notEmpty().isLength({ max: 30 }),
        body('profileImage').optional({ nullable: true }).isString().isLength({ max: 7000000 }),
        body('preferences.language').optional().isIn(['en', 'hi']),
        validate,
    ],
    userController.updateProfile,
);

// GET /api/v1/users/bookings
router.get('/bookings', authorizeRoles('user'), userController.getBookings);
router.get('/vault', authorizeRoles('user'), userController.getVault);
router.post('/addresses', authorizeRoles('user'), userController.addAddress);
router.patch('/addresses/:addressId', authorizeRoles('user'), userController.updateAddress);
router.delete('/addresses/:addressId', authorizeRoles('user'), userController.deleteAddress);
router.patch('/addresses/:addressId/default', authorizeRoles('user'), userController.setDefaultAddress);
router.patch(
    '/password',
    authorizeRoles('user'),
    [
        body('currentPassword').notEmpty(),
        body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
        validate,
    ],
    userController.changePassword,
);

export default router;

