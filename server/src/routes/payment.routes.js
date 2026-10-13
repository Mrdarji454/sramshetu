import { Router } from 'express';
import { param, body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = Router();
router.use(authenticate);
const bookingBody = body('bookingId').isMongoId().withMessage('A valid booking ID is required');
router.post('/create-order', [bookingBody, validate], paymentController.createOrder);
router.post('/verify', [
    bookingBody,
    body('razorpay_order_id').isString().matches(/^order_[A-Za-z0-9]+$/).isLength({ max: 100 }),
    body('razorpay_payment_id').isString().matches(/^pay_[A-Za-z0-9]+$/).isLength({ max: 100 }),
    body('razorpay_signature').isString().isLength({ min: 10, max: 128 }),
    validate,
], paymentController.verify);
router.post('/cash', [bookingBody, validate], paymentController.selectCash);
router.post('/:bookingId/confirm-cash', [param('bookingId').isMongoId(), validate], paymentController.confirmCash);
router.get('/:bookingId', [param('bookingId').isMongoId(), validate], paymentController.status);
router.get('/:bookingId/invoice', [param('bookingId').isMongoId(), validate], paymentController.invoice);

export default router;
