import { Router } from 'express';
import { param, body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = Router();
router.use(authenticate);
router.use('/:bookingId', param('bookingId').isMongoId().withMessage('A valid booking ID is required'), validate);
router.post('/:bookingId/create-order', paymentController.createOrder);
router.post('/:bookingId/verify-payment', [
    body('razorpay_order_id').isString().matches(/^order_[A-Za-z0-9]+$/).isLength({ max: 100 }),
    body('razorpay_payment_id').isString().matches(/^pay_[A-Za-z0-9]+$/).isLength({ max: 100 }),
    body('razorpay_signature').isString().isLength({ min: 10, max: 128 }),
    validate,
], paymentController.verify);
router.get('/:bookingId/payment-status', paymentController.status);
router.get('/:bookingId/invoice', paymentController.invoice);

export default router;
