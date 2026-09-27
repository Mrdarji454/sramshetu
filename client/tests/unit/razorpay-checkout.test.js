import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openRazorpayCheckout } from '../../src/utils/razorpayCheckout.js';

const order = { keyId: 'rzp_test_example', orderId: 'order_example', amount: 90000, currency: 'INR', testMode: true };
const booking = { _id: 'booking_example', serviceName: 'Plumbing' };
let checkout;
globalThis.window = {
  Razorpay: class {
    constructor(options) { this.options = options; checkout = this; }
    on(name, callback) { this[name] = callback; }
    open() { this.opened = true; }
  },
};

test('rejects simulated orders and invalid server amounts before Checkout opens', async () => {
  for (const invalid of [{ ...order, isSimulated: true }, { ...order, amount: 0 },
    { ...order, amount: 12.5 }, { ...order, keyId: '' }, { ...order, orderId: '' }]) {
    await assert.rejects(openRazorpayCheckout(invalid, { booking }), /valid Razorpay order/);
  }
  assert.equal(checkout, undefined);
});

test('passes server amount and order to Checkout and returns signature for server verification', async () => {
  const result = openRazorpayCheckout(order, { booking });
  await Promise.resolve();
  assert.equal(checkout.options.amount, 90000);
  assert.equal(checkout.options.order_id, order.orderId);
  assert.match(checkout.options.description, /Test Mode/);
  const response = { razorpay_order_id: order.orderId, razorpay_payment_id: 'pay_example', razorpay_signature: 'signature' };
  checkout.options.handler(response);
  checkout.options.modal.ondismiss(); // Closing after success must not cancel verification.
  assert.deepEqual(await result, response);
});

test('a failed attempt keeps Checkout open for retry without resolving success', async () => {
  let failed;
  let settled = false;
  const result = openRazorpayCheckout(order, { booking, onFailure: error => { failed = error.message; } });
  result.then(() => { settled = true; }, () => { settled = true; });
  await Promise.resolve();
  checkout['payment.failed']({ error: { description: 'Card declined' } });
  await Promise.resolve();
  assert.equal(failed, 'Card declined');
  assert.equal(settled, false);
  checkout.options.modal.ondismiss();
  await assert.rejects(result, /Card declined/);
});

test('dismissal preserves booking and is not payment success', async () => {
  const result = openRazorpayCheckout(order, { booking });
  await Promise.resolve();
  checkout.options.modal.ondismiss();
  await assert.rejects(result, error => error.checkoutDismissed && /booking is saved/.test(error.message));
});
