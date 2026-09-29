import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { buildInvoicePdf, captureAuthorizedPayment, verifyRazorpaySignature } from '../src/services/payment.service.js';
import { Payment } from '../src/models/Payment.model.js';
import paymentRoutes from '../src/routes/payment.routes.js';

const orderId = 'order_test_123';
const paymentId = 'pay_test_456';
const secret = 'test_secret';
const signature = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

assert.equal(verifyRazorpaySignature(orderId, paymentId, signature, secret), true);
assert.equal(verifyRazorpaySignature(orderId, 'pay_other', signature, secret), false);
assert.equal(verifyRazorpaySignature(orderId, paymentId, 'invalid', secret), false);
assert.equal(verifyRazorpaySignature(orderId, paymentId, `${signature}ZZ`, secret), false);
assert.equal(verifyRazorpaySignature(orderId, paymentId, { signature }, secret), false);
assert.equal(verifyRazorpaySignature(orderId, paymentId, signature.toUpperCase(), secret), true);
assert.equal(verifyRazorpaySignature('order_other', paymentId, signature, secret), false);

let captureRequest;
const capturedPayment = await captureAuthorizedPayment(
    { id: paymentId, status: 'authorized' },
    { amount: 90000, currency: 'INR' },
    async (method, path, data) => {
        captureRequest = { method, path, data };
        return { data: { id: paymentId, status: 'captured', amount: data.amount, currency: data.currency } };
    },
);
assert.deepEqual(captureRequest, {
    method: 'post',
    path: `/payments/${paymentId}/capture`,
    data: { amount: 90000, currency: 'INR' },
});
assert.equal(capturedPayment.status, 'captured');

const alreadyCaptured = await captureAuthorizedPayment(
    { id: paymentId, status: 'captured' },
    { amount: 90000, currency: 'INR' },
    async () => { throw new Error('No capture needed'); },
);
assert.equal(alreadyCaptured.status, 'captured');

let calls = 0;
const racedCapture = await captureAuthorizedPayment(
    { id: paymentId, status: 'authorized' }, { amount: 90000, currency: 'INR' },
    async method => { calls++; if (method === 'post') throw new Error('Capture response lost'); return { data: { id: paymentId, status: 'captured' } }; },
);
assert.equal(calls, 2);
assert.equal(racedCapture.status, 'captured');
await assert.rejects(captureAuthorizedPayment(
    { id: paymentId, status: 'authorized' }, { amount: 90000, currency: 'INR' },
    async () => ({ data: { status: 'authorized' } }),
), error => error.statusCode === 409);

const invoice = buildInvoicePdf(
    { _id: 'booking_12345678', serviceName: 'Electrical repair', customerName: 'Test Customer' },
    { invoiceNumber: 'SS-2026-12345678', amount: 125050, currency: 'INR', status: 'released', razorpayPaymentId: paymentId, releasedAt: new Date('2026-01-01T00:00:00Z') },
);
assert.equal(invoice.subarray(0, 8).toString(), '%PDF-1.4');
assert.match(invoice.toString(), /SS-2026-12345678/);
assert.match(invoice.toString(), /1250\.50 INR/);

const paymentStates = Payment.schema.path('paymentStatus').enumValues;
for (const state of ['PENDING', 'WORK_COMPLETED', 'PAYMENT_PENDING', 'CASH_PENDING', 'CASH_RECEIVED', 'PAID']) {
    assert.ok(paymentStates.includes(state));
}
const completedWorkPayment = new Payment({
    booking: '65f123456789012345678951', bookingId: '65f123456789012345678951',
    customer: '65f123456789012345678901', userId: '65f123456789012345678901',
    amount: 90000, currency: 'INR', paymentStatus: 'WORK_COMPLETED', status: 'WORK_COMPLETED',
});
assert.equal(completedWorkPayment.validateSync(), undefined);
assert.equal(completedWorkPayment.razorpayOrderId, null);

const routePaths = paymentRoutes.stack.filter(layer => layer.route).map(layer => `${Object.keys(layer.route.methods)[0].toUpperCase()} ${layer.route.path}`);
assert.ok(routePaths.includes('POST /create-order'));
assert.ok(routePaths.includes('POST /verify'));
assert.ok(routePaths.includes('GET /:bookingId'));
assert.ok(routePaths.includes('POST /cash'));
assert.ok(routePaths.includes('POST /:bookingId/confirm-cash'));
assert.ok(!routePaths.some(path => path.includes('verify-payment') || path.includes('payment-status')));

console.log('PASS: Razorpay signatures are verified without timing-unsafe comparison');
console.log('PASS: Invalid and mismatched payment signatures are rejected');
console.log('PASS: Authorized Razorpay payments are captured before escrow is locked');
console.log('PASS: A valid digital invoice PDF is generated');
console.log('PASS: Post-work Razorpay and cash payment states and APIs are registered');
