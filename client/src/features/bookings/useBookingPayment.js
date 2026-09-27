import { useEffect, useRef, useState } from 'react';
import { bookingService } from '../../services/booking.service';
import { openRazorpayCheckout } from '../../utils/razorpayCheckout';
import { paymentStatusLabel, paymentsEnabled } from '../../utils/paymentStatus';
export { paymentStatusLabel, paymentsEnabled } from '../../utils/paymentStatus';

const unwrap = result => result?.data || result;
const paid = status => ['escrow_locked', 'released', 'refunded'].includes(status);

export function useBookingPayment({ booking, customer, onPaymentUpdated, onBookingUpdated }) {
  const bookingId = booking?._id || booking?.id;
  const [paymentStatus, setPaymentStatus] = useState(booking?.paymentStatus || 'pending');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const busy = useRef(false);
  const pendingVerification = useRef(null);

  useEffect(() => {
    setPaymentStatus(booking?.paymentStatus || 'pending');
  }, [bookingId, booking?.paymentStatus]);
  useEffect(() => {
    pendingVerification.current = null;
    setPaymentMessage('');
  }, [bookingId]);

  const applyPayment = payment => {
    if (!payment?.status) throw new Error('Payment status was not returned by the server. Refresh before retrying.');
    setPaymentStatus(payment.status);
    onBookingUpdated?.({
      ...booking,
      paymentStatus: payment.status,
      refundStatus: payment.refundStatus ?? booking.refundStatus,
      paymentProvider: {
        ...booking.paymentProvider,
        ...(payment.invoiceUrl ? { invoiceUrl: payment.invoiceUrl } : {}),
        ...(payment.paymentId ? { transactionId: payment.paymentId } : {}),
      },
    });
    return payment;
  };

  const refreshPayment = async () => applyPayment(unwrap(await bookingService.getPaymentStatus(bookingId)));

  const handlePayment = async () => {
    if (!paymentsEnabled) {
      setPaymentMessage('Online payments are disabled for this development session. Generate the work OTP directly.');
      return;
    }
    if (!bookingId || busy.current) return;
    busy.current = true;
    setIsPaying(true);
    setPaymentMessage('');
    let verified = false;
    try {
      // Retain a successful Checkout response until server verification succeeds.
      // A network interruption must not ask the customer to pay a second time.
      if (!pendingVerification.current) {
        const order = unwrap(await bookingService.createPaymentOrder(bookingId));
        pendingVerification.current = await openRazorpayCheckout(order, {
          booking, customer,
          onFailure: error => setPaymentMessage(error.message),
        });
      }
      const payment = applyPayment(unwrap(await bookingService.verifyPayment(bookingId, pendingVerification.current)));
      verified = paid(payment.status);
      if (verified) pendingVerification.current = null;
      setPaymentMessage(verified
        ? 'Payment confirmed. Escrow is released after End OTP verification.'
        : 'Payment is awaiting confirmation. Check the status before retrying.');
    } catch (error) {
      try {
        const payment = await refreshPayment();
        verified = paid(payment.status);
        if (verified) pendingVerification.current = null;
        setPaymentMessage(verified
          ? `${paymentStatusLabel(payment.status)}. Your payment is confirmed.`
          : pendingVerification.current
            ? 'Checkout completed, but confirmation is pending. Retry verification here; you will not be charged again.'
            : error.message || 'Payment did not complete. You can retry here.');
      } catch {
        setPaymentMessage(pendingVerification.current
          ? 'Checkout completed, but confirmation is still unavailable. Payment is not confirmed yet; retry verification here before trying Checkout again.'
          : 'Payment status could not be reached. No success was recorded. Retry the payment action to reuse or reconcile any existing order.');
      }
    } finally {
      busy.current = false;
      setIsPaying(false);
      // A dashboard refresh failure cannot change a confirmed payment result.
      Promise.resolve(onPaymentUpdated?.()).catch(() => { });
    }
  };

  const downloadInvoice = async () => {
    try {
      await bookingService.downloadInvoice(bookingId);
    } catch (error) {
      setPaymentMessage(error.message || 'Invoice could not be downloaded. Please retry.');
    }
  };

  return {
    paymentStatus, isPaying, paymentMessage, handlePayment, downloadInvoice, paymentsEnabled,
    retryingVerification: Boolean(pendingVerification.current)
  };
}
