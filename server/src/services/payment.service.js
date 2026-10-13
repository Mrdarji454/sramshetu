import { createHmac, timingSafeEqual } from 'node:crypto';
import axios from 'axios';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.model.js';
import { Payment } from '../models/Payment.model.js';
import { Worker } from '../models/Worker.model.js';
import { AppError } from '../utils/AppError.js';
import { bookingNotification, notifyAdmins, safelyNotify } from './notification.service.js';
import { buildInvoicePdf } from './invoice.service.js';
import { config } from '../config/env.js';

export { buildInvoicePdf } from './invoice.service.js';

const keyId = () => process.env.RAZORPAY_KEY_ID;
const keySecret = () => process.env.RAZORPAY_KEY_SECRET;
const ref = value => String(value?._id || value || '');
const statusOf = value => String(value || '').toUpperCase();

function requireDatabase() {
  if (mongoose.connection.readyState !== 1) throw new AppError('Payments require a connected database', 503);
}

function requireGateway(payment) {
  if (!keyId() || !keySecret()) throw new AppError('Razorpay Test Mode is not configured', 503);
  if (process.env.RAZORPAY_TEST_MODE === 'false' || !keyId().startsWith('rzp_test_')) {
    throw new AppError('Only Razorpay Test Mode is supported', 503);
  }
  if (payment?.gatewayKeyId && payment.gatewayKeyId !== keyId()) {
    throw new AppError('This order belongs to a different Razorpay configuration', 409);
  }
}

async function razorpayRequest(method, path, data) {
  try {
    return await axios({
      method,
      url: `https://api.razorpay.com/v1${path}`,
      data,
      auth: { username: keyId(), password: keySecret() },
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
  } catch (error) {
    const gateway = error.response?.data?.error || error.response?.data;
    const message = gateway?.description || gateway?.message || error.message || 'Razorpay request failed';
    if (config.env === 'development') console.error('[Razorpay]', method, path, message);
    throw new AppError(message, 502);
  }
}

async function notifyPaymentFailure(booking, message) {
  await safelyNotify(() => notifyAdmins({
    type: 'PAYMENT_FAILED', title: 'Payment failed',
    message: `${message} for booking ${ref(booking)}.`, relatedBooking: booking._id,
    eventKey: `payment-failed:${ref(booking)}:${Date.now()}`,
  }));
}

function assertWorkCompleted(booking) {
  if (statusOf(booking.status) === 'CANCELLED') throw new AppError('Cancelled bookings cannot be paid', 409);
  if (statusOf(booking.status) !== 'COMPLETED' || !booking.endOTP?.usedAt || !booking.qrVerification?.isVerified) {
    throw new AppError('Payment is available only after successful End-Work OTP verification', 409);
  }
}

function amountFromBooking(booking) {
  const amount = Math.round(Number(booking.price?.totalAmount) * 100);
  if (!Number.isSafeInteger(amount) || amount <= 0 || (booking.price?.currency || 'INR') !== 'INR') {
    throw new AppError('Booking amount or currency is invalid', 400);
  }
  return amount;
}

function paymentSummary(payment) {
  if (!payment) return null;
  const bookingId = ref(payment.bookingId || payment.booking);
  return {
    paymentId: ref(payment), bookingId, paymentStatus: payment.paymentStatus, status: payment.paymentStatus,
    paymentMethod: payment.paymentMethod, amount: payment.amount, amountRupees: payment.amount / 100,
    currency: payment.currency, razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    transactionId: payment.razorpayPaymentId || payment.receiptId,
    receiptId: payment.receiptId, paidAt: payment.paidAt, failureReason: payment.failureReason,
    testMode: payment.mode === 'test',
    invoiceUrl: payment.paymentStatus === 'PAID' ? `/payments/${bookingId}/invoice` : null,
  };
}

async function syncBooking(payment) {
  await Booking.updateOne(
    { _id: payment.bookingId || payment.booking, status: { $in: ['COMPLETED', 'completed'] }, 'endOTP.usedAt': { $ne: null } },
    { $set: {
      paymentRecord: payment._id, paymentStatus: payment.paymentStatus, paymentMethod: payment.paymentMethod,
      'paymentProvider.provider': payment.paymentMethod === 'CASH' ? 'cash' : payment.paymentMethod === 'RAZORPAY' ? 'razorpay' : null,
      'paymentProvider.orderId': payment.razorpayOrderId,
      'paymentProvider.transactionId': payment.razorpayPaymentId || payment.receiptId,
      'paymentProvider.status': payment.paymentStatus,
      'paymentProvider.confirmedAt': payment.paidAt,
      'paymentProvider.invoiceUrl': payment.paymentStatus === 'PAID' ? `/payments/${ref(payment.bookingId || payment.booking)}/invoice` : null,
    } },
  );
}

export function verifyRazorpaySignature(orderId, paymentId, signature, secret = keySecret()) {
  if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string' ||
      !/^[a-fA-F0-9]{64}$/.test(signature) || !secret) return false;
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

export async function captureAuthorizedPayment(gatewayPayment, payment, request = razorpayRequest) {
  if (gatewayPayment.status !== 'authorized') return gatewayPayment;
  let result;
  try {
    ({ data: result } = await request('post', `/payments/${encodeURIComponent(gatewayPayment.id)}/capture`, {
      amount: payment.amount, currency: payment.currency,
    }));
  } catch {
    ({ data: result } = await request('get', `/payments/${encodeURIComponent(gatewayPayment.id)}`));
  }
  if (result?.status !== 'captured') throw new AppError('Payment has not been captured', 409);
  return result;
}

function assertGatewayPayment(gateway, payment) {
  if (!gateway || !/^pay_[A-Za-z0-9]+$/.test(gateway.id || '') ||
      gateway.order_id !== payment.razorpayOrderId || gateway.amount !== payment.amount || gateway.currency !== payment.currency) {
    throw new AppError('Razorpay payment does not match the stored order and amount', 409);
  }
}

export async function markWorkCompletedForPayment(booking) {
  requireDatabase();
  assertWorkCompleted(booking);
  const amount = amountFromBooking(booking);
  const customerId = booking.customer?._id || booking.customer;
  const payment = await Payment.findOneAndUpdate(
    { booking: booking._id },
    { $setOnInsert: {
      booking: booking._id, bookingId: booking._id, customer: customerId, userId: customerId,
      workerId: booking.worker?._id || booking.worker || null,
      cooperativeId: booking.cooperative?._id || booking.cooperative || null,
      amount, currency: booking.price?.currency || 'INR', paymentStatus: 'WORK_COMPLETED', status: 'WORK_COMPLETED',
      statusHistory: [{ status: 'WORK_COMPLETED', at: new Date() }],
    } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (payment.amount !== amount) throw new AppError('Stored payment amount differs from the final booking amount', 409);
  await syncBooking(payment);
  return payment;
}

async function paymentForCompletedBooking(booking) {
  assertWorkCompleted(booking);
  return await Payment.findOne({ booking: booking._id }) || markWorkCompletedForPayment(booking);
}

export async function createPaymentOrder(booking, customerId) {
  requireDatabase();
  if (ref(booking.customer) !== ref(customerId)) throw new AppError('Only the booking customer may pay', 403);
  assertWorkCompleted(booking);
  requireGateway();
  let payment = await paymentForCompletedBooking(booking);
  if (payment.paymentStatus === 'PAID') throw new AppError('This booking is already paid', 409);
  if (payment.paymentMethod === 'CASH' || ['CASH_PENDING', 'CASH_RECEIVED'].includes(payment.paymentStatus)) {
    throw new AppError('Cash on Delivery is already selected for this booking', 409);
  }
  if (payment.razorpayOrderId) {
    if (payment.paymentStatus !== 'PAYMENT_PENDING') throw new AppError('This payment cannot create another order', 409);
    return { keyId: keyId(), orderId: payment.razorpayOrderId, amount: payment.amount, currency: payment.currency, paymentId: ref(payment), testMode: true };
  }
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, paymentStatus: 'WORK_COMPLETED', razorpayOrderId: null, orderCreationState: { $ne: 'creating' } },
    { $set: { orderCreationState: 'creating' } }, { new: true },
  );
  if (!claimed) throw new AppError('A payment order is already being created; retry shortly', 409);
  try {
    const { data: order } = await razorpayRequest('post', '/orders', {
      amount: payment.amount, currency: payment.currency, partial_payment: false,
      receipt: `ss_${ref(booking).slice(-20)}`, notes: { bookingId: ref(booking) },
    });
    if (!/^order_[A-Za-z0-9]+$/.test(order?.id || '') || order.amount !== payment.amount || order.currency !== payment.currency) {
      throw new AppError('Razorpay returned an invalid order', 502);
    }
    payment = await Payment.findOneAndUpdate(
      { _id: payment._id, paymentStatus: 'WORK_COMPLETED', razorpayOrderId: null, orderCreationState: 'creating' },
      { $set: {
        razorpayOrderId: order.id, gatewayKeyId: keyId(), mode: 'test', paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAYMENT_PENDING', status: 'PAYMENT_PENDING', orderCreationState: 'idle', failureReason: null,
      }, $push: { statusHistory: { status: 'PAYMENT_PENDING', at: new Date(), actor: customerId } } },
      { new: true },
    );
    if (!payment) throw new AppError('Payment state changed while creating the order', 409);
    await syncBooking(payment);
    await bookingNotification(await Booking.findById(booking._id), 'PAYMENT_PENDING', `payment-pending:${ref(payment)}`);
    return { keyId: keyId(), orderId: payment.razorpayOrderId, amount: payment.amount, currency: payment.currency, paymentId: ref(payment), testMode: true };
  } catch (error) {
    await Payment.updateOne({ _id: payment._id, razorpayOrderId: null }, { $set: { orderCreationState: 'idle', failureReason: error.message } });
    await notifyPaymentFailure(booking, error.message);
    throw error;
  }
}

export async function verifyPayment(booking, customerId, payload = {}) {
  requireDatabase();
  if (ref(booking.customer) !== ref(customerId)) throw new AppError('Only the booking customer may verify payment', 403);
  assertWorkCompleted(booking);
  const payment = await Payment.findOne({ booking: booking._id }).select('+razorpaySignature');
  if (!payment || payment.paymentMethod !== 'RAZORPAY' || payment.paymentStatus !== 'PAYMENT_PENDING') {
    if (payment?.paymentStatus === 'PAID') throw new AppError('This booking is already paid', 409);
    throw new AppError('No pending Razorpay order exists for this booking', 409);
  }
  requireGateway(payment);
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = payload;
  if (orderId !== payment.razorpayOrderId || !verifyRazorpaySignature(payment.razorpayOrderId, paymentId, signature)) {
    await Payment.updateOne({ _id: payment._id }, { $set: { failureReason: 'Razorpay signature verification failed' } });
    await notifyPaymentFailure(booking, 'Razorpay signature verification failed');
    throw new AppError('Razorpay signature verification failed', 400);
  }
  const { data: gatewayPayment } = await razorpayRequest('get', `/payments/${encodeURIComponent(paymentId)}`);
  assertGatewayPayment(gatewayPayment, payment);
  let captured;
  try {
    captured = await captureAuthorizedPayment(gatewayPayment, payment);
    assertGatewayPayment(captured, payment);
    if (captured.status !== 'captured') throw new AppError('Razorpay payment was not captured', 409);
  } catch (error) {
    await Payment.updateOne({ _id: payment._id, paymentStatus: 'PAYMENT_PENDING' }, { $set: { failureReason: error.message } });
    await notifyPaymentFailure(booking, error.message);
    throw error;
  }
  const now = new Date();
  const paid = await Payment.findOneAndUpdate(
    { _id: payment._id, paymentStatus: 'PAYMENT_PENDING', razorpayPaymentId: null },
    { $set: {
      razorpayPaymentId: captured.id, razorpaySignature: signature, verifiedVia: 'checkout', gatewayPaymentStatus: 'captured',
      paymentStatus: 'PAID', status: 'PAID', paidAt: now, invoiceIssuedAt: now,
      invoiceNumber: `SS-${now.getUTCFullYear()}-${ref(payment).toUpperCase()}`, receiptId: captured.id, failureReason: null,
    }, $push: { statusHistory: { status: 'PAID', at: now, actor: customerId } } },
    { new: true },
  );
  if (!paid) throw new AppError('Duplicate or conflicting payment attempt blocked', 409);
  await syncBooking(paid);
  const fresh = await Booking.findById(booking._id);
  await bookingNotification(fresh, 'ONLINE_PAYMENT_SUCCESSFUL', `online-paid:${ref(paid)}`);
  await bookingNotification(fresh, 'PAYMENT_RECEIVED', `payment-received:${ref(paid)}`);
  return paymentSummary(paid);
}

export async function selectCashPayment(booking, customerId) {
  requireDatabase();
  if (ref(booking.customer) !== ref(customerId)) throw new AppError('Only the booking customer may select Cash on Delivery', 403);
  let payment = await paymentForCompletedBooking(booking);
  if (payment.paymentStatus === 'PAID') throw new AppError('This booking is already paid', 409);
  if (payment.razorpayOrderId || payment.paymentMethod === 'RAZORPAY') throw new AppError('Online payment is already pending for this booking', 409);
  payment = await Payment.findOneAndUpdate(
    { _id: payment._id, paymentStatus: 'WORK_COMPLETED', paymentMethod: null },
    { $set: { paymentMethod: 'CASH', paymentStatus: 'CASH_PENDING', status: 'CASH_PENDING', failureReason: null },
      $push: { statusHistory: { status: 'CASH_PENDING', at: new Date(), actor: customerId } } }, { new: true },
  );
  if (!payment) throw new AppError('Cash payment was already selected or the payment state changed', 409);
  await syncBooking(payment);
  await bookingNotification(await Booking.findById(booking._id), 'PAYMENT_PENDING', `cash-pending:${ref(payment)}`);
  return paymentSummary(payment);
}

async function isAssignedPaymentRecipient(booking, actorId, role) {
  const normalizedRole = statusOf(role);
  if (normalizedRole === 'ADMIN') return true;
  if (normalizedRole === 'COOPERATIVE') {
    if (ref(booking.cooperative) === ref(actorId)) return true;
    const actor = await mongoose.model('User').findById(actorId).select('cooperativeId');
    return ref(actor?.cooperativeId) === ref(booking.cooperative);
  }
  if (normalizedRole !== 'WORKER') return false;
  if (ref(booking.worker) === ref(actorId)) return true;
  const profile = await Worker.findOne({ user: actorId }).select('_id');
  return ref(profile?._id) === ref(booking.worker);
}

export async function confirmCashReceived(booking, actorId, role) {
  requireDatabase();
  assertWorkCompleted(booking);
  if (!await isAssignedPaymentRecipient(booking, actorId, role)) {
    throw new AppError('Only the assigned worker or cooperative may confirm cash receipt', 403);
  }
  let payment = await Payment.findOne({ booking: booking._id });
  if (!payment || payment.paymentMethod !== 'CASH' || payment.paymentStatus !== 'CASH_PENDING') {
    if (payment?.paymentStatus === 'PAID') throw new AppError('Cash receipt is already confirmed', 409);
    throw new AppError('Cash on Delivery must be selected by the customer first', 409);
  }
  const now = new Date();
  const receiptId = `CASH-${ref(payment).slice(-12).toUpperCase()}`;
  payment = await Payment.findOneAndUpdate(
    { _id: payment._id, paymentStatus: 'CASH_PENDING', paymentMethod: 'CASH' },
    { $set: { paymentStatus: 'CASH_RECEIVED', status: 'CASH_RECEIVED', cashReceivedAt: now,
      cashReceivedBy: actorId, receiptId, failureReason: null },
      $push: { statusHistory: { status: 'CASH_RECEIVED', at: now, actor: actorId } } }, { new: true },
  );
  if (!payment) throw new AppError('Duplicate cash confirmation blocked', 409);
  payment = await Payment.findOneAndUpdate(
    { _id: payment._id, paymentStatus: 'CASH_RECEIVED' },
    { $set: { paymentStatus: 'PAID', status: 'PAID', paidAt: now, invoiceIssuedAt: now,
      invoiceNumber: `SS-${now.getUTCFullYear()}-${ref(payment).toUpperCase()}` },
      $push: { statusHistory: { status: 'PAID', at: now, actor: actorId } } }, { new: true },
  );
  await syncBooking(payment);
  const fresh = await Booking.findById(booking._id);
  await bookingNotification(fresh, 'CASH_PAYMENT_CONFIRMED', `cash-paid:${ref(payment)}`);
  await bookingNotification(fresh, 'PAYMENT_RECEIVED', `payment-received:${ref(payment)}`);
  return paymentSummary(payment);
}

export async function getPaymentForBooking(booking) {
  requireDatabase();
  const payment = await Payment.findOne({ booking: booking._id });
  if (!payment) return {
    bookingId: ref(booking), paymentStatus: booking.paymentStatus || 'PENDING', status: booking.paymentStatus || 'PENDING',
    paymentMethod: booking.paymentMethod || null, amount: amountFromBooking(booking), amountRupees: Number(booking.price?.totalAmount),
    currency: booking.price?.currency || 'INR', invoiceUrl: null,
  };
  return paymentSummary(payment);
}

export async function invoiceForBooking(booking) {
  requireDatabase();
  const payment = await Payment.findOne({ booking: booking._id });
  if (!payment || payment.paymentStatus !== 'PAID' || !payment.invoiceIssuedAt || !payment.invoiceNumber) {
    throw new AppError('Invoice is available only after payment confirmation', 404);
  }
  return { buffer: buildInvoicePdf(booking, payment), filename: `${payment.invoiceNumber}.pdf` };
}

export async function refundPaymentForBooking(booking) {
  const payment = await Payment.findOne({ booking: booking._id });
  if (payment?.paymentStatus === 'PAID') throw new AppError('Paid completed work requires administrator review', 409);
  return payment;
}

export const refreshPaymentStatus = getPaymentForBooking;
export async function assertBookingPaymentLocked() {
  throw new AppError('Pre-work escrow is no longer used; payment unlocks after End-Work OTP verification', 409);
}
export async function releasePaymentForBooking() {
  throw new AppError('Payment is confirmed after work completion; escrow release is not applicable', 409);
}
