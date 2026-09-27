import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import axios from 'axios';
import mongoose from 'mongoose';

// Every gateway request is intercepted. This suite uses no real Razorpay keys,
// accounts, charges, or application database, including when a developer has .env.
const environment = { ...process.env };
process.env.NODE_ENV = 'test';
process.env.RAZORPAY_KEY_ID = 'rzp_test_integration';
process.env.RAZORPAY_KEY_SECRET = 'local-test-secret';
process.env.RAZORPAY_TEST_MODE = 'true';
process.env.JWT_SECRET = 'local-payment-integration-jwt-secret';

const [{ default: app }, { Booking }, { Payment }, { User }, { Worker }, { Cooperative }, { Notification }, { AuthService }] = await Promise.all([
    import('../src/app.js'), import('../src/models/Booking.model.js'), import('../src/models/Payment.model.js'),
    import('../src/models/User.model.js'), import('../src/models/Worker.model.js'), import('../src/models/Cooperative.model.js'),
    import('../src/models/Notification.model.js'), import('../src/services/auth.service.js'),
]);

const dbName = `shramsetu_payments_test_${Date.now()}_${randomBytes(4).toString('hex')}`;
const originalAdapter = axios.defaults.adapter;
const orders = new Map(), gatewayPayments = new Map(), refunds = new Map();
const calls = [], unexpectedRequests = [], unavailableOrders = new Set(), ambiguousRefunds = new Set();
let serial = 0, failNextOrder = false, passed = 0, http;

function gatewayPayment(orderId, status = 'captured', overrides = {}) {
    const order = orders.get(orderId);
    assert.ok(order, 'The fake gateway must already know this order');
    const payment = { id: `pay_T${++serial}`, order_id: orderId, amount: order.amount, currency: order.currency, status, ...overrides };
    gatewayPayments.set(payment.id, payment);
    return payment;
}

const signature = (orderId, paymentId) => createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
const checkout = payment => ({ razorpay_order_id: payment.order_id, razorpay_payment_id: payment.id, razorpay_signature: signature(payment.order_id, payment.id) });
const callCount = (method, path) => calls.filter(call => call.method === method && call.path === path).length;

axios.defaults.adapter = async config => {
    const url = new URL(config.url);
    const method = config.method.toLowerCase(), path = url.pathname.replace(/^\/v1/, '');
    const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    calls.push({ method, path, data });
    assert.equal(url.origin, 'https://api.razorpay.com', 'Unexpected network destination');
    assert.equal(config.auth?.username, 'rzp_test_integration');
    assert.equal(config.auth?.password, 'local-test-secret');
    const respond = value => ({ data: structuredClone(value), status: 200, statusText: 'OK', headers: {}, config });
    if (method === 'post' && path === '/orders') {
        if (failNextOrder) { failNextOrder = false; throw new Error('Fake gateway unavailable'); }
        const order = { id: `order_T${++serial}`, amount: data.amount, currency: data.currency, receipt: data.receipt, notes: data.notes };
        orders.set(order.id, order);
        // Overlap concurrent create requests to exercise the unique booking index.
        await new Promise(resolve => setTimeout(resolve, 15));
        return respond(order);
    }
    let match = path.match(/^\/orders\/(order_[A-Za-z0-9]+)\/payments$/);
    if (method === 'get' && match) {
        if (unavailableOrders.has(match[1])) throw new Error('Fake reconciliation timeout');
        return respond({ items: [...gatewayPayments.values()].filter(payment => payment.order_id === match[1]) });
    }
    match = path.match(/^\/payments\/(pay_[A-Za-z0-9]+)(?:\/(capture|refund|refunds))?$/);
    if (match) {
        const payment = gatewayPayments.get(match[1]);
        assert.ok(payment, 'Unknown fake gateway payment');
        if (method === 'get' && !match[2]) return respond(payment);
        if (method === 'post' && match[2] === 'capture') {
            assert.equal(data.amount, payment.amount);
            assert.equal(data.currency, payment.currency);
            payment.status = 'captured';
            return respond(payment);
        }
        if (method === 'get' && match[2] === 'refunds') return respond({ items: refunds.get(payment.id) || [] });
        if (method === 'post' && match[2] === 'refund') {
            assert.equal(data.amount, payment.amount);
            const refund = { id: `rfnd_T${++serial}`, payment_id: payment.id, amount: payment.amount, status: 'pending' };
            refunds.set(payment.id, [...(refunds.get(payment.id) || []), refund]);
            // The provider accepted the refund but its HTTP response was lost.
            if (ambiguousRefunds.has(payment.id)) throw new Error('Fake response lost after refund acceptance');
            return respond(refund);
        }
    }
    unexpectedRequests.push(`${method} ${path}`);
    throw new Error(`Unexpected fake gateway request: ${method} ${path}`);
};

async function test(name, action) {
    await action();
    passed++;
    console.log(`PASS: ${name}`);
}

try {
    await mongoose.connect('mongodb://127.0.0.1:27028', { dbName, serverSelectionTimeoutMS: 5000 });
    await Promise.all([Booking.init(), Payment.init(), User.init(), Worker.init(), Cooperative.init(), Notification.init()]);
    const [customer, workerUser, manager, admin, stranger, otherWorker, otherManager] = await User.create(
        ['USER', 'WORKER', 'COOPERATIVE', 'ADMIN', 'USER', 'WORKER', 'COOPERATIVE'].map((role, index) => ({
            name: `Payment Test ${index}`, phone: `989000000${index}`, password: 'local-test-password', role,
        })),
    );
    const cooperative = await Cooperative.create({ name: 'Payment Test Guild', registrationDetails: { registrationNumber: 'PAYMENT-TEST-001', state: 'Maharashtra' } });
    const otherCooperative = await Cooperative.create({ name: 'Other Payment Guild', registrationDetails: { registrationNumber: 'PAYMENT-TEST-002', state: 'Maharashtra' } });
    manager.cooperativeId = cooperative._id; await manager.save();
    otherManager.cooperativeId = otherCooperative._id; await otherManager.save();
    const worker = await Worker.create({ user: workerUser._id, cooperative: cooperative._id, experience: { primaryTrade: 'Electrical', years: 3 }, rates: { dailyFloorRate: 1000, hourlyRate: 450 } });
    http = app.listen(0, '127.0.0.1');
    await once(http, 'listening');
    const base = `http://127.0.0.1:${http.address().port}/api`;
    const tokens = new Map([customer, workerUser, manager, admin, stranger, otherWorker, otherManager].map(user => [String(user._id), AuthService.generateToken(user)]));
    const request = async (user, method, path, body) => {
        const response = await fetch(base + path, {
            method, headers: { 'Content-Type': 'application/json', ...(user && { Authorization: `Bearer ${tokens.get(String(user._id))}` }) },
            ...(body !== undefined && { body: JSON.stringify(body) }),
        });
        const result = response.headers.get('content-type')?.startsWith('application/pdf')
            ? Buffer.from(await response.arrayBuffer()) : await response.json();
        return { status: response.status, body: result, headers: response.headers };
    };
    const expect = async (user, method, path, body, status = 200) => {
        const result = await request(user, method, path, body);
        assert.equal(result.status, status, `${method} ${path}: ${result.body?.message || result.status}`);
        return result;
    };
    const route = (booking, action) => `/payments/${booking._id}/${action}`;
    const newBooking = overrides => Booking.create({
        customer: customer._id, worker: worker._id, cooperative: cooperative._id,
        customerName: customer.name, workerName: workerUser.name, cooperativeName: cooperative.name,
        serviceName: 'Electrical repair', trade: 'Electrical', status: 'ASSIGNED',
        price: { floorRateAmount: 450, totalAmount: 900, currency: 'INR' },
        scheduledTime: { start: new Date(Date.now() + 86400000) },
        location: { type: 'Point', coordinates: [73.8, 18.5], serviceAddress: { street: 'Payment Test Street', city: 'Pune' } },
        ...overrides,
    });
    const orderFor = async booking => (await expect(customer, 'POST', route(booking, 'create-order'), {}, 201)).body.data;
    const payBooking = async booking => {
        const order = await orderFor(booking);
        const payment = gatewayPayment(order.orderId);
        await expect(customer, 'POST', route(booking, 'verify-payment'), checkout(payment));
        return payment;
    };

    let main, order, authorized;
    await test('Booking and Razorpay order use server amounts despite forged request prices', async () => {
        const created = await expect(customer, 'POST', '/bookings', {
            serviceName: 'Electrical repair', trade: 'Electrical', workerId: String(worker._id), cooperativeId: String(cooperative._id),
            location: { coordinates: [73.8, 18.5], serviceAddress: { street: 'Payment Test Street', city: 'Pune' } },
            scheduledTime: { start: new Date(Date.now() + 86400000) }, price: { floorRateAmount: 0.01, totalAmount: 0.01 },
            paymentStatus: 'released', refundStatus: 'processed',
        }, 201);
        main = created.body.data;
        assert.equal(main.price.totalAmount, 900);
        assert.equal(main.paymentStatus, 'pending');
        assert.equal(main.refundStatus, 'not_applicable');
        const results = await Promise.all([
            expect(customer, 'POST', route(main, 'create-order'), { amount: 1, currency: 'USD' }, 201),
            expect(customer, 'POST', route(main, 'create-order'), { amount: 999999999 }, 201),
        ]);
        order = results[0].body.data;
        assert.equal(order.amount, 90000);
        assert.equal(order.currency, 'INR');
        assert.equal(order.orderId, results[1].body.data.orderId);
        assert.equal(order.paymentId, results[1].body.data.paymentId);
        assert.equal(await Payment.countDocuments({ booking: main._id }), 1);
        assert.equal(String((await Booking.findById(main._id)).paymentRecord), order.paymentId);
        assert.equal(order.isSimulated, undefined);
    });

    await test('Payment status and invoice routes enforce authentication and booking ownership for every role', async () => {
        await expect(null, 'GET', route(main, 'payment-status'), undefined, 401);
        await expect(customer, 'GET', '/payments/invalid/payment-status', undefined, 400);
        for (const actor of [customer, workerUser, manager, admin]) {
            const result = await expect(actor, 'GET', route(main, 'payment-status'));
            assert.equal(result.body.data.paymentId, order.paymentId);
            assert.match(result.headers.get('cache-control'), /no-store/);
            assert.equal(result.body.data.razorpaySignature, undefined);
        }
        for (const actor of [stranger, otherWorker, otherManager]) {
            await expect(actor, 'GET', route(main, 'payment-status'), undefined, 403);
            await expect(actor, 'GET', route(main, 'invoice'), undefined, 403);
        }
        for (const actor of [workerUser, manager, admin]) {
            await expect(actor, 'POST', route(main, 'create-order'), {}, 403);
            await expect(actor, 'POST', route(main, 'verify-payment'), {
                razorpay_order_id: order.orderId, razorpay_payment_id: 'pay_Unowned', razorpay_signature: '0'.repeat(64),
            }, 403);
        }
        await expect(customer, 'GET', route(main, 'invoice'), undefined, 404);
    });

    await test('Malformed signatures and client isSimulated flags cannot unlock escrow', async () => {
        for (const payload of [
            { razorpay_order_id: order.orderId, razorpay_payment_id: 'pay_Forged', isSimulated: true },
            { razorpay_order_id: order.orderId, razorpay_payment_id: 'pay_Forged', razorpay_signature: '0'.repeat(64), isSimulated: true },
            { razorpay_order_id: 'order_sim_forged', razorpay_payment_id: 'pay_sim_forged', razorpay_signature: 'simulated_signature', isSimulated: true },
        ]) await expect(customer, 'POST', route(main, 'verify-payment'), payload, 400);
        assert.equal((await Booking.findById(main._id)).paymentStatus, 'pending');
        assert.equal((await Payment.findOne({ booking: main._id })).status, 'pending');
        assert.ok(await Notification.exists({ recipientId: admin._id, relatedBooking: main._id, type: 'PAYMENT_FAILED' }));
    });

    await test('A valid signature still requires the gateway order, amount, and currency to match', async () => {
        const wrongAmount = gatewayPayment(order.orderId, 'captured', { amount: 1 });
        await expect(customer, 'POST', route(main, 'verify-payment'), checkout(wrongAmount), 409);
        const wrongCurrency = gatewayPayment(order.orderId, 'captured', { currency: 'USD' });
        await expect(customer, 'POST', route(main, 'verify-payment'), checkout(wrongCurrency), 409);
        assert.equal((await Payment.findOne({ booking: main._id })).status, 'pending');
    });

    await test('Authorized payments are captured and duplicate callbacks verify signatures without double capture', async () => {
        authorized = gatewayPayment(order.orderId, 'authorized');
        const result = await expect(customer, 'POST', route(main, 'verify-payment'), checkout(authorized));
        assert.equal(result.body.data.status, 'escrow_locked');
        assert.equal(result.body.data.razorpayPaymentId, authorized.id);
        assert.equal(callCount('post', `/payments/${authorized.id}/capture`), 1);
        await expect(customer, 'POST', route(main, 'verify-payment'), checkout(authorized));
        await expect(customer, 'POST', route(main, 'verify-payment'), { ...checkout(authorized), razorpay_signature: '0'.repeat(64), isSimulated: true }, 400);
        assert.equal(callCount('post', `/payments/${authorized.id}/capture`), 1);
        const stored = await Payment.findOne({ booking: main._id }).select('+razorpaySignature');
        assert.equal(stored.razorpaySignature, signature(order.orderId, authorized.id));
        assert.equal(stored.verifiedVia, 'checkout');
        assert.ok(stored.paidAt);
        assert.equal(await Notification.countDocuments({ relatedBooking: main._id, recipientId: customer._id, type: 'PAYMENT_CONFIRMED' }), 1);
        await expect(customer, 'GET', route(main, 'invoice'), undefined, 404);
    });

    await test('Status reconciliation recovers a lost Checkout callback and accepts a later genuine signature', async () => {
        const booking = await newBooking();
        const pending = await orderFor(booking);
        const captured = gatewayPayment(pending.orderId);
        const result = await expect(customer, 'GET', route(booking, 'payment-status'));
        assert.equal(result.body.data.status, 'escrow_locked');
        assert.equal((await Booking.findById(booking._id)).paymentStatus, 'escrow_locked');
        const stored = await Payment.findOne({ booking: booking._id }).select('+razorpaySignature');
        assert.equal(stored.verifiedVia, 'gateway');
        assert.equal(stored.razorpaySignature, null);
        await expect(customer, 'POST', route(booking, 'verify-payment'), checkout(captured));
        assert.equal((await Payment.findById(stored._id).select('+razorpaySignature')).razorpaySignature, signature(pending.orderId, captured.id));
        assert.equal(await Notification.countDocuments({ relatedBooking: booking._id, recipientId: customer._id, type: 'PAYMENT_CONFIRMED' }), 1);
    });

    await test('Failed payments notify admins and retry the same stored order without replacing payment history', async () => {
        const booking = await newBooking();
        const pending = await orderFor(booking);
        gatewayPayment(pending.orderId, 'failed', { error_description: 'Test bank declined payment' });
        const failed = await expect(customer, 'GET', route(booking, 'payment-status'));
        assert.equal(failed.body.data.status, 'failed');
        assert.equal((await Booking.findById(booking._id)).paymentStatus, 'failed');
        assert.ok(await Notification.exists({ recipientId: admin._id, relatedBooking: booking._id, type: 'PAYMENT_FAILED' }));
        const retried = await orderFor(booking);
        assert.equal(retried.orderId, pending.orderId);
        assert.equal(retried.paymentId, pending.paymentId);
        const paid = gatewayPayment(pending.orderId, 'authorized');
        await expect(customer, 'POST', route(booking, 'verify-payment'), checkout(paid));
        const refreshed = await expect(customer, 'GET', route(booking, 'payment-status'));
        assert.equal(refreshed.body.data.status, 'escrow_locked');
        assert.equal(refreshed.body.data.failureReason, null);
        assert.equal(await Payment.countDocuments({ booking: booking._id }), 1);
    });

    await test('Gateway outages never create simulated orders or discard an existing payable order', async () => {
        const booking = await newBooking();
        failNextOrder = true;
        await expect(customer, 'POST', route(booking, 'create-order'), {}, 502);
        assert.equal(await Payment.countDocuments({ booking: booking._id }), 0);
        const pending = await orderFor(booking);
        unavailableOrders.add(pending.orderId);
        const status = await expect(customer, 'GET', route(booking, 'payment-status'));
        assert.equal(status.body.data.status, 'pending');
        assert.equal(status.body.data.reconciliationPending, true);
        await expect(customer, 'POST', route(booking, 'create-order'), {}, 502);
        unavailableOrders.delete(pending.orderId);
        assert.equal((await orderFor(booking)).orderId, pending.orderId);
    });

    let firstInvoice, issuedAt, releasedAt, invoiceNumber;
    await test('Only customer-issued Start and End OTPs can start work and release captured payment', async () => {
        await expect(workerUser, 'POST', `/bookings/${main._id}/accept`, {});
        await expect(workerUser, 'PATCH', `/bookings/${main._id}/status`, { status: 'ON_THE_WAY' });
        await expect(workerUser, 'PATCH', `/bookings/${main._id}/status`, { status: 'IN_PROGRESS' }, 403);
        await expect(admin, 'PATCH', `/bookings/${main._id}/status`, { status: 'COMPLETED' }, 403);
        await expect(workerUser, 'POST', `/bookings/${main._id}/start-otp`, {}, 403);
        const start = (await expect(customer, 'POST', `/bookings/${main._id}/start-otp`, {})).body.data;
        const workerView = (await expect(workerUser, 'GET', `/bookings/${main._id}`)).body.data;
        assert.equal(workerView.startOTP, undefined);
        assert.equal(workerView.endOTP, undefined);
        assert.equal(workerView.qrVerification.otpCode, undefined);
        await expect(customer, 'POST', `/bookings/${main._id}/verify-start-otp`, { code: start.code }, 403);
        await expect(workerUser, 'POST', `/bookings/${main._id}/verify-start-otp`, { code: '000000' }, 400);
        await expect(workerUser, 'POST', `/bookings/${main._id}/verify-start-otp`, { code: start.code });
        assert.equal((await Payment.findOne({ booking: main._id })).status, 'escrow_locked');
        const end = (await expect(customer, 'POST', `/bookings/${main._id}/end-otp`, {})).body.data;
        await expect(workerUser, 'POST', `/bookings/${main._id}/verify-end-otp`, { code: '000000' }, 400);
        const completed = await expect(workerUser, 'POST', `/bookings/${main._id}/verify-end-otp`, { code: end.code });
        assert.equal(completed.body.data.status, 'COMPLETED');
        assert.equal(completed.body.data.paymentStatus, 'released');
        await expect(workerUser, 'POST', `/bookings/${main._id}/verify-end-otp`, { code: end.code }, 409);
        const stored = await Payment.findOne({ booking: main._id });
        assert.equal(stored.status, 'released');
        assert.ok(stored.invoiceNumber && stored.invoiceIssuedAt && stored.releasedAt);
        invoiceNumber = stored.invoiceNumber; issuedAt = stored.invoiceIssuedAt.toISOString(); releasedAt = stored.releasedAt.toISOString();
        firstInvoice = (await expect(customer, 'GET', route(main, 'invoice'))).body;
        assert.equal(firstInvoice.subarray(0, 8).toString(), '%PDF-1.4');
        for (const [actor, type] of [[customer, 'PAYMENT_RELEASED'], [workerUser, 'PAYMENT_RELEASED'], [manager, 'SETTLEMENT_COMPLETED']]) {
            assert.equal(await Notification.countDocuments({ recipientId: actor._id, relatedBooking: main._id, type }), 1);
        }
    });

    await test('Released invoices are stable, available to related roles, private, and never re-release payment', async () => {
        for (const actor of [customer, workerUser, manager, admin]) {
            const invoice = await expect(actor, 'GET', route(main, 'invoice'));
            assert.ok(invoice.body.equals(firstInvoice));
            assert.match(invoice.headers.get('content-disposition'), new RegExp(invoiceNumber));
            assert.match(invoice.headers.get('cache-control'), /no-store/);
            const status = await expect(actor, 'GET', route(main, 'payment-status'));
            assert.equal(status.body.data.status, 'released');
            assert.equal(status.body.data.invoiceUrl, route(main, 'invoice'));
        }
        for (const actor of [stranger, otherWorker, otherManager]) await expect(actor, 'GET', route(main, 'invoice'), undefined, 403);
        await expect(customer, 'POST', route(main, 'verify-payment'), checkout(authorized));
        const stored = await Payment.findOne({ booking: main._id });
        assert.equal(stored.invoiceNumber, invoiceNumber);
        assert.equal(stored.invoiceIssuedAt.toISOString(), issuedAt);
        assert.equal(stored.releasedAt.toISOString(), releasedAt);
        assert.equal(await Notification.countDocuments({ recipientId: manager._id, relatedBooking: main._id, type: 'SETTLEMENT_COMPLETED' }), 1);
        assert.equal(await Notification.countDocuments({ recipientId: customer._id, relatedBooking: main._id, type: 'PAYMENT_RELEASED' }), 1);
    });

    await test('A paid cancellation reports refund pending until the provider confirms processed', async () => {
        const booking = await newBooking(), payment = await payBooking(booking);
        const cancelled = await expect(customer, 'PATCH', `/bookings/${booking._id}/status`, { status: 'CANCELLED', note: 'Test cancellation' });
        assert.equal(cancelled.body.data.status, 'CANCELLED');
        assert.equal(cancelled.body.data.refundStatus, 'pending');
        assert.equal(cancelled.body.data.paymentStatus, 'escrow_locked');
        assert.equal(callCount('post', `/payments/${payment.id}/refund`), 1);
        await expect(customer, 'POST', route(booking, 'create-order'), {}, 409);
        await expect(customer, 'GET', route(booking, 'invoice'), undefined, 404);
        const pending = await expect(customer, 'GET', route(booking, 'payment-status'));
        assert.equal(pending.body.data.refundStatus, 'pending');
        refunds.get(payment.id)[0].status = 'processed';
        const processed = await expect(customer, 'GET', route(booking, 'payment-status'));
        assert.equal(processed.body.data.status, 'refunded');
        assert.equal(processed.body.data.refundStatus, 'processed');
        assert.ok(processed.body.data.refundedAt);
        assert.equal((await Booking.findById(booking._id)).paymentStatus, 'refunded');
        assert.equal(callCount('post', `/payments/${payment.id}/refund`), 1);
        assert.ok(await Notification.exists({ recipientId: admin._id, relatedBooking: booking._id, type: 'REFUND_ALERT' }));
    });

    await test('Ambiguous refund responses are reconciled without sending a duplicate refund request', async () => {
        const booking = await newBooking(), payment = await payBooking(booking);
        ambiguousRefunds.add(payment.id);
        const cancelled = await expect(customer, 'PATCH', `/bookings/${booking._id}/status`, { status: 'CANCELLED' });
        assert.equal(cancelled.body.data.refundStatus, 'pending');
        assert.equal((await Payment.findOne({ booking: booking._id })).refundStatus, 'pending');
        await expect(customer, 'GET', route(booking, 'payment-status'));
        await expect(admin, 'GET', route(booking, 'payment-status'));
        assert.equal(callCount('post', `/payments/${payment.id}/refund`), 1);
        refunds.get(payment.id)[0].status = 'processed';
        assert.equal((await expect(customer, 'GET', route(booking, 'payment-status'))).body.data.status, 'refunded');
        assert.equal(callCount('post', `/payments/${payment.id}/refund`), 1);
    });

    await test('Cancellation reconciles a captured payment with a lost callback and leaves unpaid bookings unrefunded', async () => {
        const booking = await newBooking(), pending = await orderFor(booking);
        const payment = gatewayPayment(pending.orderId);
        const cancelled = await expect(customer, 'PATCH', `/bookings/${booking._id}/status`, { status: 'CANCELLED' });
        assert.equal(cancelled.body.data.refundStatus, 'pending');
        assert.equal(callCount('post', `/payments/${payment.id}/refund`), 1);
        assert.equal(await Notification.countDocuments({ recipientId: customer._id, relatedBooking: booking._id, type: 'PAYMENT_CONFIRMED' }), 0);
        const unpaidBooking = await newBooking();
        const unpaidCancellation = await expect(customer, 'PATCH', `/bookings/${unpaidBooking._id}/status`, { status: 'CANCELLED' });
        assert.equal(unpaidCancellation.body.data.refundStatus, 'not_applicable');
        assert.equal(await Payment.countDocuments({ booking: unpaidBooking._id }), 0);
    });

    await test('Stored booking payment flags cannot replace a verified payment record or OTP completion', async () => {
        const forged = await newBooking({ status: 'ON_THE_WAY', paymentStatus: 'escrow_locked' });
        await expect(customer, 'POST', `/bookings/${forged._id}/start-otp`, {}, 409);
        const incomplete = await newBooking();
        await payBooking(incomplete);
        await Booking.updateOne({ _id: incomplete._id }, { $set: { status: 'COMPLETED' } });
        await expect(customer, 'GET', route(incomplete, 'payment-status'), undefined, 409);
        await expect(customer, 'GET', route(incomplete, 'invoice'), undefined, 409);
        assert.equal((await Payment.findOne({ booking: incomplete._id })).status, 'escrow_locked');
    });

    assert.deepEqual(unexpectedRequests, []);
    console.log(`Payment integration: ${passed} scenarios passed using local MongoDB and a fake gateway`);
} finally {
    axios.defaults.adapter = originalAdapter;
    if (http) await new Promise(resolve => http.close(resolve));
    if (mongoose.connection.readyState === 1) {
        assert.equal(mongoose.connection.name, dbName, 'Only the unique payment test database may be dropped');
        assert.ok(dbName.startsWith('shramsetu_payments_test_'));
        await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
    for (const name of ['NODE_ENV', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_TEST_MODE', 'JWT_SECRET']) {
        if (environment[name] === undefined) delete process.env[name]; else process.env[name] = environment[name];
    }
}
