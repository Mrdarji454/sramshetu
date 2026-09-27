import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { BookingService } from '../services/booking.service.js';
import { createPaymentOrder, invoiceForBooking, refreshPaymentStatus, verifyPayment } from '../services/payment.service.js';
import { config } from '../config/env.js';

const actor = req => ({ id: req.user._id || req.user.id, role: req.user.role });
const logPaymentDebug = (...args) => { if (config.env === 'development') console.error(...args); };

export const createOrder = asyncHandler(async (req, res) => {
    const { id, role } = actor(req);
    const bookingId = req.params.bookingId;
    let booking;
    try {
        booking = await BookingService.getBookingById(bookingId, id, role);
    } catch (error) {
        logPaymentDebug('[payments:create-order] Booking lookup failed', { bookingId, bookingFound: false, message: error.message });
        throw error;
    }
    const totalAmount = Number(booking.price?.totalAmount);
    const amountInPaise = Number.isFinite(totalAmount) ? Math.round(totalAmount * 100) : NaN;
    logPaymentDebug('[payments:create-order] Request', { bookingId, bookingFound: Boolean(booking), amountInPaise, currency: booking.price?.currency || 'INR' });
    try {
        const data = await createPaymentOrder(booking, id);
        return successResponse(res, data, 'Razorpay order created', 201);
    } catch (error) {
        logPaymentDebug('[payments:create-order] Failed', {
            bookingId,
            bookingFound: Boolean(booking),
            amountInPaise,
            errorMessage: error.message,
            razorpayErrorDescription: error.razorpayDescription || null,
            razorpayResponse: error.razorpayResponse || null,
        });
        throw error;
    }
});

export const verify = asyncHandler(async (req, res) => {
    const { id, role } = actor(req);
    const booking = await BookingService.getBookingById(req.params.bookingId, id, role);
    const data = await verifyPayment(booking, id, req.body);
    return successResponse(res, data, 'Payment verified');
});

export const status = asyncHandler(async (req, res) => {
    const { id, role } = actor(req);
    const booking = await BookingService.getBookingById(req.params.bookingId, id, role);
    const data = await refreshPaymentStatus(booking);
    res.set('Cache-Control', 'private, no-store');
    return successResponse(res, data, 'Payment status retrieved');
});

export const invoice = asyncHandler(async (req, res) => {
    const { id, role } = actor(req);
    const booking = await BookingService.getBookingById(req.params.bookingId, id, role);
    const { buffer, filename } = await invoiceForBooking(booking);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store' });
    return res.send(buffer);
});
