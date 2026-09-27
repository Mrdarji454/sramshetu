import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import axios from 'axios';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.model.js';
import { Payment } from '../models/Payment.model.js';
import { AppError } from '../utils/AppError.js';
import { bookingNotification, notifyAdmins, safelyNotify } from './notification.service.js';
import { buildInvoicePdf } from './invoice.service.js';
import { config } from '../config/env.js';

export { buildInvoicePdf } from './invoice.service.js';
const keyId = () => process.env.RAZORPAY_KEY_ID;
const keySecret = () => process.env.RAZORPAY_KEY_SECRET;
const ref = value => String(value?._id || value || '');
const cancelled = booking => String(booking.status).toUpperCase() === 'CANCELLED';
const unpaid = ['pending', 'failed'];

function requireDatabase() {
    if (mongoose.connection.readyState !== 1) throw new AppError('Payments require a connected database', 503);
}

function requireGateway(payment) {
    if (!keyId() || !keySecret()) throw new AppError('Razorpay is not configured. Set the server test API keys.', 503);
    // Standard Checkout does not hold worker settlements. Block real money until
    // Route/linked-account custody and payouts have been implemented.
    if (process.env.RAZORPAY_TEST_MODE === 'false' || !keyId().startsWith('rzp_test_')) {
        throw new AppError('This integration requires Razorpay Test Mode. Live settlement and payouts are not configured.', 503);
    }
    if (payment && (payment.gatewayKeyId !== keyId() || payment.razorpayOrderId?.startsWith('order_sim_'))) {
        throw new AppError('This payment belongs to a different or unsupported gateway configuration', 409);
    }
}

async function razorpayRequest(method, path, data) {
    try {
        return await axios({
            method, url: `https://api.razorpay.com/v1${path}`, data,
            auth: { username: keyId(), password: keySecret() },
            headers: { 'Content-Type': 'application/json' }, timeout: 15000
        });
    } catch (error) {
        const response = error.response?.data || null;
        const gatewayError = response?.error || response;
        const description = gatewayError?.description || gatewayError?.message || null;
        if (config.env === 'development') {
            console.error('[Razorpay] Gateway request failed', {
                method,
                path,
                httpStatus: error.response?.status || null,
                message: error.message,
                errorCode: gatewayError?.code || null,
                errorDescription: description,
                response,
            });
        }
        const appError = new AppError(description || error.message || 'Razorpay request failed', 502);
        appError.razorpayDescription = description;
        appError.razorpayResponse = response;
        throw appError;
    }
}

async function alertAdmins(booking, type, title, suffix = '') {
    await safelyNotify(() => notifyAdmins({
        type, title, message: `${title} for booking ${ref(booking)}.`,
        relatedBooking: booking._id, eventKey: `${type}:${ref(booking)}:${suffix}`
    }));
}

export function verifyRazorpaySignature(orderId, paymentId, signature, secret = keySecret()) {
    if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string' ||
        !/^[a-fA-F0-9]{64}$/.test(signature) || !secret) return false;
    const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
    return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

function assertGatewayPayment(gateway, payment) {
    if (!gateway || typeof gateway.id !== 'string' || !/^pay_[a-zA-Z0-9]+$/.test(gateway.id) ||
        gateway.order_id !== payment.razorpayOrderId || gateway.amount !== payment.amount || gateway.currency !== payment.currency) {
        throw new AppError('Razorpay payment does not match the stored order and amount', 409);
    }
}

export async function captureAuthorizedPayment(gatewayPayment, payment, request = razorpayRequest) {
    if (gatewayPayment.status !== 'authorized') return gatewayPayment;
    let result;
    try {
        ({ data: result } = await request('post', `/payments/${encodeURIComponent(gatewayPayment.id)}/capture`, { amount: payment.amount, currency: payment.currency }));
    } catch {
        // Auto-capture can race this request; the response can also be lost.
        ({ data: result } = await request('get', `/payments/${encodeURIComponent(gatewayPayment.id)}`));
    }
    if (result?.status !== 'captured') throw new AppError('Payment has not been captured. Refresh payment status before retrying.', 409);
    return result;
}

function summary(payment) {
    return {
        status: payment.status, paymentId: ref(payment), razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId, amount: payment.amount, currency: payment.currency,
        paidAt: payment.paidAt, confirmedAt: payment.paidAt, releasedAt: payment.releasedAt,
        refundStatus: payment.refundStatus, refundedAt: payment.refundedAt, failureReason: payment.failureReason,
        testMode: payment.mode === 'test', invoiceUrl: payment.invoiceIssuedAt ? `/payments/${ref(payment.booking)}/invoice` : null
    };
}

// Payment is authoritative. Conditional writes and refresh repair interrupted
// two-document writes without requiring a replica set or downgrading money states.
async function syncBookingPayment(payment) {
    const filter = { _id: payment.booking };
    if (unpaid.includes(payment.status)) filter.paymentStatus = { $in: unpaid };
    if (payment.status === 'escrow_locked') filter.paymentStatus = { $nin: ['released', 'refunded'] };
    if (payment.status === 'released') {
        filter.status = { $in: ['COMPLETED', 'completed'] };
        filter['endOTP.usedAt'] = { $ne: null };
        filter.paymentStatus = { $ne: 'refunded' };
    }
    await Booking.updateOne(filter, {
        $set: {
            paymentRecord: payment._id, paymentStatus: payment.status, refundStatus: payment.refundStatus,
            'paymentProvider.provider': 'razorpay', 'paymentProvider.orderId': payment.razorpayOrderId,
            'paymentProvider.transactionId': payment.razorpayPaymentId,
            'paymentProvider.status': payment.status === 'escrow_locked' ? 'captured' : payment.status,
            'paymentProvider.confirmedAt': payment.paidAt, 'paymentProvider.refundStatus': payment.refundStatus,
            'paymentProvider.refundConfirmedAt': payment.refundedAt,
            'paymentProvider.invoiceUrl': summary(payment).invoiceUrl,
        }
    });
}

async function recordCapturedPayment(booking, payment, gateway, signature) {
    assertGatewayPayment(gateway, payment);
    const captured = await captureAuthorizedPayment(gateway, payment);
    assertGatewayPayment(captured, payment);
    if (captured.id !== gateway.id || captured.status !== 'captured') throw new AppError('Payment is not captured', 409);
    const updated = await Payment.findOneAndUpdate({ _id: payment._id, status: { $in: unpaid } }, {
        $set: {
            razorpayPaymentId: captured.id, status: 'escrow_locked', paidAt: new Date(), failureReason: null,
            verifiedVia: signature ? 'checkout' : 'gateway', gatewayPaymentStatus: 'captured', ...(signature && { razorpaySignature: signature }),
        }
    }, { new: true });
    payment = updated || await Payment.findById(payment._id);
    if (payment.razorpayPaymentId !== captured.id) throw new AppError('A different payment is already linked to this booking', 409);
    if (signature) await Payment.updateOne({ _id: payment._id, razorpayPaymentId: captured.id }, { $set: { razorpaySignature: signature, gatewayPaymentStatus: 'captured' } });
    await syncBookingPayment(payment);
    const freshBooking = await Booking.findById(booking._id);
    if (payment.status === 'escrow_locked' && !cancelled(freshBooking)) {
        await bookingNotification(freshBooking, 'PAYMENT_CONFIRMED', `payment-confirmed:${ref(payment)}`);
    }
    return payment;
}

export async function createPaymentOrder(booking, customerId) {
    if (!config.paymentsEnabled) throw new AppError('Online payments are disabled in development; use the Start OTP directly.', 503);
    requireDatabase();
    if (ref(booking.customer) !== ref(customerId)) throw new AppError('Only the booking customer may pay', 403);
    requireGateway();
    if (['CANCELLED', 'COMPLETED', 'DISPUTED', 'IN_PROGRESS'].includes(String(booking.status).toUpperCase())) throw new AppError('This booking cannot be paid', 409);
    if (!unpaid.includes(booking.paymentStatus)) throw new AppError('This booking already has a payment', 409);
    const amount = Math.round(Number(booking.price?.totalAmount) * 100);
    const currency = booking.price?.currency || 'INR';
    if (!Number.isSafeInteger(amount) || amount <= 0 || currency !== 'INR') throw new AppError('Booking amount or currency is invalid', 400);
    let payment = await Payment.findOne({ booking: booking._id });
    if (payment) {
        requireGateway(payment);
        const refreshed = await refreshPaymentStatus(booking);
        if (refreshed.reconciliationPending) throw new AppError('Could not check the existing order. Refresh payment status before retrying.', 502);
        payment = await Payment.findById(payment._id);
        if (!unpaid.includes(payment.status)) throw new AppError('This booking already has a confirmed payment; refresh the booking', 409);
        if (payment.amount !== amount || payment.currency !== currency) throw new AppError('The existing payment amount differs from the booking. Contact support.', 409);
    } else {
        let order;
        try {
            ({ data: order } = await razorpayRequest('post', '/orders', {
                amount, currency, partial_payment: false,
                receipt: `ss_${ref(booking).slice(-16)}_${randomBytes(3).toString('hex')}`,
                notes: { bookingId: ref(booking) },
            }));
        } catch (error) {
            await alertAdmins(booking, 'PAYMENT_FAILED', 'Payment order could not be created', 'create-order');
            throw error;
        }
        if (!/^order_[a-zA-Z0-9]+$/.test(order?.id) || order.amount !== amount || order.currency !== currency) throw new AppError('Razorpay returned an invalid order', 502);
        // Unique booking index selects one order across concurrent servers. Only
        // the winning order is handed to Checkout; failed orders are never replaced.
        try {
            payment = await Payment.findOneAndUpdate({ booking: booking._id }, {
                $setOnInsert: {
                    booking: booking._id, customer: customerId, razorpayOrderId: order.id,
                    gatewayKeyId: keyId(), mode: 'test', amount, currency, status: 'pending',
                }
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
        } catch (error) {
            if (error.code !== 11000) throw error;
            payment = await Payment.findOne({ booking: booking._id });
            if (!payment) throw error;
        }
    }
    const freshBooking = await Booking.findById(booking._id);
    if (cancelled(freshBooking) || !unpaid.includes(payment.status)) throw new AppError('Booking payment state changed. Refresh the booking.', 409);
    await syncBookingPayment(payment);
    return { keyId: keyId(), orderId: payment.razorpayOrderId, amount: payment.amount, currency: payment.currency, paymentId: ref(payment), testMode: true };
}

export async function verifyPayment(booking, customerId, payload = {}) {
    if (!config.paymentsEnabled) throw new AppError('Online payments are disabled in development.', 503);
    requireDatabase();
    if (ref(booking.customer) !== ref(customerId)) throw new AppError('Only the booking customer may verify payment', 403);
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = payload;
    const payment = await Payment.findOne({ booking: booking._id });
    if (!payment || payment.razorpayOrderId !== orderId) throw new AppError('Payment order does not match this booking', 400);
    requireGateway(payment);
    // Even duplicate callbacks must verify. HMAC always uses the stored order ID.
    if (!verifyRazorpaySignature(payment.razorpayOrderId, paymentId, signature)) {
        await alertAdmins(booking, 'PAYMENT_FAILED', 'Payment signature verification failed', 'signature');
        throw new AppError('Razorpay signature verification failed', 400);
    }
    if (!/^pay_[a-zA-Z0-9]+$/.test(paymentId)) throw new AppError('Invalid Razorpay payment ID', 400);
    if (payment.razorpayPaymentId && payment.razorpayPaymentId !== paymentId) throw new AppError('A different payment is linked to this booking', 409);
    if (unpaid.includes(payment.status)) {
        const { data } = await razorpayRequest('get', `/payments/${encodeURIComponent(paymentId)}`);
        if (data.id !== paymentId) throw new AppError('Razorpay returned a different payment', 409);
        await recordCapturedPayment(booking, payment, data, signature);
    } else {
        await Payment.updateOne({ _id: payment._id }, { $set: { razorpaySignature: signature } });
    }
    return refreshPaymentStatus(await Booking.findById(booking._id));
}

export async function assertBookingPaymentLocked(booking) {
    requireDatabase();
    if (!booking.paymentRecord || !['escrow_locked', 'held'].includes(booking.paymentStatus) ||
        !['not_applicable', undefined, null].includes(booking.refundStatus)) {
        throw new AppError('A verified payment must be locked before work verification', 409);
    }
    const payment = await Payment.findOne({
        _id: booking.paymentRecord,
        booking: booking._id,
        status: 'escrow_locked',
        refundStatus: 'not_applicable',
    }).select('+razorpaySignature');
    const validCheckoutSignature = payment?.verifiedVia === 'checkout' &&
        verifyRazorpaySignature(payment.razorpayOrderId, payment.razorpayPaymentId, payment.razorpaySignature);
    const gatewayConfirmed = payment?.gatewayPaymentStatus === 'captured' || payment?.verifiedVia === 'gateway' || validCheckoutSignature;
    if (!payment?.paidAt || !payment.razorpayPaymentId || !gatewayConfirmed) {
        throw new AppError('A captured Razorpay payment is required before work verification', 409);
    }
    return payment;
}

export async function releasePaymentForBooking(booking) {
    requireDatabase();
    const fresh = await Booking.findById(booking._id);
    if (String(fresh?.status).toUpperCase() !== 'COMPLETED' || !fresh.startOTP?.usedAt || !fresh.endOTP?.usedAt) throw new AppError('Payment release requires verified Start and End OTPs', 409);
    let payment = await Payment.findOne({ _id: fresh.paymentRecord, booking: fresh._id });
    if (!payment || !['escrow_locked', 'released'].includes(payment.status) || payment.refundStatus !== 'not_applicable' || !payment.paidAt || !payment.razorpayPaymentId) throw new AppError('No captured payment is available for release', 409);
    if (payment.status === 'escrow_locked') {
        const now = new Date();
        payment = await Payment.findOneAndUpdate({ _id: payment._id, status: 'escrow_locked', refundStatus: 'not_applicable' }, {
            $set: {
                status: 'released', releasedAt: now, invoiceIssuedAt: now,
                invoiceNumber: `SS-${now.getUTCFullYear()}-${ref(payment).toUpperCase()}`,
            }
        }, { new: true }) || await Payment.findById(payment._id);
    }
    if (payment.status !== 'released') throw new AppError('Payment state changed before release', 409);
    await syncBookingPayment(payment);
    await bookingNotification(await Booking.findById(fresh._id), 'PAYMENT_RELEASED', `payment-released:${ref(payment)}`);
    return payment;
}

async function applyRefund(booking, payment, refund) {
    if (!refund || refund.payment_id !== payment.razorpayPaymentId || refund.amount !== payment.amount ||
        !['pending', 'processed', 'failed'].includes(refund.status)) throw new AppError('Refund does not match this payment', 409);
    const fields = { razorpayRefundId: refund.id, refundStatus: refund.status, refundFailureReason: null };
    if (refund.status === 'processed') Object.assign(fields, { status: 'refunded', refundedAt: new Date() });
    if (refund.status === 'failed') fields.refundFailureReason = 'Razorpay reported a failed refund; administrator review required';
    payment = await Payment.findOneAndUpdate({ _id: payment._id, status: { $ne: 'refunded' } }, { $set: fields }, { new: true }) || await Payment.findById(payment._id);
    await syncBookingPayment(payment);
    await alertAdmins(booking, 'REFUND_ALERT', refund.status === 'processed' ? 'Booking payment refunded' : refund.status === 'failed' ? 'Refund needs review' : 'Refund is processing', refund.status);
    return payment;
}

async function reconcileRefund(booking, payment) {
    const { data } = await razorpayRequest('get', `/payments/${encodeURIComponent(payment.razorpayPaymentId)}/refunds`);
    const refund = data.items?.find(item => item.amount === payment.amount && item.payment_id === payment.razorpayPaymentId && item.status !== 'failed') ||
        data.items?.find(item => item.id === payment.razorpayRefundId);
    if (refund) return applyRefund(booking, payment, refund);
    return payment;
}

export async function refundPaymentForBooking(booking) {
    requireDatabase();
    const fresh = await Booking.findById(booking._id);
    if (!cancelled(fresh)) throw new AppError('Only cancelled bookings may be refunded', 409);
    let payment = await Payment.findOne({ booking: fresh._id });
    if (!payment || payment.status === 'refunded') return payment;
    if (unpaid.includes(payment.status)) {
        // Checkout may have succeeded before cancellation without a callback.
        await refreshPaymentStatus(fresh);
        return Payment.findById(payment._id);
    }
    if (payment.status !== 'escrow_locked') throw new AppError('Released payments require administrator refund review', 409);
    requireGateway(payment);
    if (payment.refundStatus !== 'not_applicable') return reconcileRefund(fresh, payment);
    payment = await Payment.findOneAndUpdate({ _id: payment._id, status: 'escrow_locked', refundStatus: 'not_applicable' }, {
        $set: {
            refundStatus: 'pending', refundRequestedAt: new Date(),
        }
    }, { new: true });
    if (!payment) return Payment.findOne({ booking: fresh._id });
    await syncBookingPayment(payment);
    await alertAdmins(fresh, 'REFUND_ALERT', 'Cancelled booking refund requested', 'requested');
    try {
        const { data } = await razorpayRequest('post', `/payments/${encodeURIComponent(payment.razorpayPaymentId)}/refund`, {
            amount: payment.amount, notes: { bookingId: ref(fresh) }, receipt: `refund_${ref(payment)}`,
        });
        return await applyRefund(fresh, payment, data);
    } catch {
        // Timeouts can occur AFTER refund creation. Do not automatically resubmit;
        // query Razorpay until its result is known, or have an admin review it.
        await Payment.updateOne({ _id: payment._id, refundStatus: 'pending' }, { $set: { refundFailureReason: 'Refund confirmation unavailable; gateway reconciliation or administrator review required' } });
        await alertAdmins(fresh, 'REFUND_ALERT', 'Refund confirmation needs review', 'unconfirmed');
        return Payment.findById(payment._id);
    }
}

export async function refreshPaymentStatus(booking) {
    requireDatabase();
    let payment = await Payment.findOne({ booking: booking._id });
    if (!payment) return { status: booking.paymentStatus || 'pending', paymentId: null, refundStatus: booking.refundStatus || 'not_applicable', invoiceUrl: null };
    requireGateway(payment);
    let reconciliationPending = false;
    if (unpaid.includes(payment.status)) {
        try {
            const { data } = await razorpayRequest('get', `/orders/${encodeURIComponent(payment.razorpayOrderId)}/payments`);
            const match = item => item.order_id === payment.razorpayOrderId && item.amount === payment.amount && item.currency === payment.currency;
            const successful = data.items?.find(item => match(item) && item.status === 'captured') || data.items?.find(item => match(item) && item.status === 'authorized');
            if (successful) payment = await recordCapturedPayment(booking, payment, successful);
            else {
                const failed = data.items?.find(item => match(item) && item.status === 'failed');
                if (failed) {
                    payment = await Payment.findOneAndUpdate({ _id: payment._id, status: { $in: unpaid } }, {
                        $set: {
                            status: 'failed', failureReason: String(failed.error_description || failed.error_reason || 'Payment failed').slice(0, 500),
                        }
                    }, { new: true }) || await Payment.findById(payment._id);
                    await alertAdmins(booking, 'PAYMENT_FAILED', 'Payment failed', failed.id);
                }
            }
        } catch (error) {
            if (error.statusCode !== 502) throw error;
            reconciliationPending = true;
        }
    }
    const fresh = await Booking.findById(booking._id);
    if (cancelled(fresh) && payment.status === 'escrow_locked') {
        try { payment = await refundPaymentForBooking(fresh); }
        catch (error) { if (error.statusCode !== 502) throw error; reconciliationPending = true; }
    } else if (String(fresh.status).toUpperCase() === 'COMPLETED' && ['escrow_locked', 'released'].includes(payment.status)) {
        payment = await releasePaymentForBooking(fresh);
    }
    await syncBookingPayment(payment);
    return { ...summary(payment), reconciliationPending };
}

export async function invoiceForBooking(booking) {
    requireDatabase();
    if (String(booking.status).toUpperCase() === 'COMPLETED') await releasePaymentForBooking(booking);
    const payment = await Payment.findOne({ booking: booking._id });
    if (!payment?.invoiceIssuedAt || !payment.invoiceNumber) throw new AppError('Invoice is available after End OTP verification and payment release', 404);
    return { buffer: buildInvoicePdf(booking, payment), filename: `${payment.invoiceNumber}.pdf` };
}
