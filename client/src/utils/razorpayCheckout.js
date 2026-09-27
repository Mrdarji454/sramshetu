const CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let checkoutScript;

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = window.setTimeout(() => fail(), 15000);
    const fail = () => {
      window.clearTimeout(timer);
      script.remove();
      checkoutScript = undefined;
      reject(new Error('Razorpay Checkout could not be loaded. Please retry.'));
    };
    script.src = CHECKOUT_URL;
    script.async = true;
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timer);
      if (!window.Razorpay) return fail();
      resolve();
    };
    document.body.appendChild(script);
  });
  return checkoutScript;
}

// This only collects the Checkout response. The server must verify it before
// any component displays a successful payment or unlocks work verification.
export async function openRazorpayCheckout(order, { booking, customer = {}, onFailure } = {}) {
  if (order?.isSimulated || !/^rzp_(test|live)_/.test(order?.keyId || '') ||
      !/^order_/.test(order?.orderId || '') || !Number.isSafeInteger(order?.amount) ||
      order.amount <= 0 || order.currency !== 'INR') {
    throw new Error('A valid Razorpay order is required. Please refresh the booking and retry.');
  }
  await loadRazorpayCheckout();
  return new Promise((resolve, reject) => {
    let submitted = false;
    let lastFailure;
    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'ShramSetu',
      description: `${booking.serviceName || booking.trade || 'Service booking'}${order.testMode ? ' (Test Mode)' : ''}`,
      prefill: {
        name: customer.name || booking.customerName || booking.customer?.name || '',
        email: customer.email || booking.customerEmail || booking.customer?.email || '',
        contact: customer.phone || booking.customerPhone || booking.customer?.phone || '',
      },
      notes: { bookingId: String(booking._id || booking.id) },
      theme: { color: '#d97706' },
      handler: response => {
        submitted = true;
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          if (submitted) return;
          const error = lastFailure || new Error('Checkout closed. Your booking is saved and payment can be retried here.');
          error.checkoutDismissed = !lastFailure;
          reject(error);
        },
      },
    });
    checkout.on('payment.failed', event => {
      lastFailure = new Error(event.error?.description || 'Payment failed. You can retry in Checkout.');
      // Razorpay keeps Checkout open for another attempt. Keep the Pay button
      // disabled until Checkout closes, so a second concurrent order cannot open.
      onFailure?.(lastFailure);
    });
    checkout.open();
  });
}
