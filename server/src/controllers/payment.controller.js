import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { BookingService } from '../services/booking.service.js';
import {
    confirmCashReceived, createPaymentOrder, getPaymentForBooking,
    invoiceForBooking, selectCashPayment, verifyPayment,
} from '../services/payment.service.js';

const actor = req => ({ id: req.user._id || req.user.id, role: req.user.role });
const bookingIdFrom = req => req.params.bookingId || req.body.bookingId;

export const createOrder = asyncHandler(async (req, res) => {
    const { id, role } = actor(req);
    const booking = await BookingService.getBookingById(bookingIdFrom(req), id, role);
    return successResponse(res, await createPaymentOrder(booking, id), 'Razorpay order created', 201);
});

export const verify = asyncHandler(async (req, res) => {
    const { id, role } = actor(req);
    const booking = await BookingService.getBookingById(bookingIdFrom(req), id, role);
    const data = await verifyPayment(booking, id, req.body);
    return successResponse(res, data, 'Payment verified');
});

export const status = asyncHandler(async (req, res) => {
    const { id, role } = actor(req);
    const booking = await BookingService.getBookingById(req.params.bookingId, id, role);
    const data = await getPaymentForBooking(booking);
    res.set('Cache-Control', 'private, no-store');
    return successResponse(res, data, 'Payment status retrieved');
});

export const selectCash = asyncHandler(async (req, res) => {
    const { id, role } = actor(req);
    const booking = await BookingService.getBookingById(bookingIdFrom(req), id, role);
    return successResponse(res, await selectCashPayment(booking, id), 'Cash on Delivery selected');
});

export const confirmCash = asyncHandler(async (req, res) => {
    const { id, role } = actor(req);
    const booking = await BookingService.getBookingById(bookingIdFrom(req), id, role);
    return successResponse(res, await confirmCashReceived(booking, id, role), 'Cash receipt confirmed');
});

export const invoice = asyncHandler(async (req, res) => {
    const { id, role } = actor(req);
    const booking = await BookingService.getBookingById(req.params.bookingId, id, role);
    const { buffer, filename } = await invoiceForBooking(booking);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store' });
    return res.send(buffer);
});
