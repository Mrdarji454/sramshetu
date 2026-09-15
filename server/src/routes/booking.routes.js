import { Router } from 'express';
import { body } from 'express-validator';
import * as bookingController from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// Protect all booking routes
router.use(authenticate);

// 1. Discover suitable cooperatives and available artisans for location & service
router.get('/suitable', bookingController.getSuitableCooperativesAndWorkers);

// 2. Create a new service booking (Customer)
router.post(
  '/',
  authorizeRoles('user', 'admin'),
  [
    body('location.serviceAddress.street')
      .notEmpty()
      .withMessage('Street address is required'),
    body('location.serviceAddress.city')
      .notEmpty()
      .withMessage('City is required'),
    body('scheduledTime.start')
      .notEmpty()
      .withMessage('Preferred scheduled date/time is required'),
    validate,
  ],
  bookingController.createBooking
);

// 3. Get bookings list (scoped to authenticated user's role)
router.get('/', bookingController.getBookings);

// 4. Get specific booking details
router.get('/:id', bookingController.getBookingById);

// 5. Cooperative assigns worker to booking
router.patch(
  '/:id/assign',
  authorizeRoles('cooperative', 'admin'),
  [
    body('workerId').notEmpty().withMessage('Worker ID is required'),
    validate,
  ],
  bookingController.assignWorker
);

// 6. Update booking status with state machine verification
router.patch(
  '/:id/status',
  [
    body('status').notEmpty().withMessage('Target status is required'),
    validate,
  ],
  bookingController.updateStatus
);

// 7. Worker accepts assignment
router.post(
  '/:id/accept',
  authorizeRoles('worker', 'admin'),
  bookingController.acceptBooking
);

// 8. Worker declines / rejects assignment
router.post(
  '/:id/reject',
  authorizeRoles('worker', 'admin'),
  bookingController.rejectBooking
);

export default router;

