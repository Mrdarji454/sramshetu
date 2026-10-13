export const paymentsEnabled = import.meta.env?.VITE_PAYMENTS_ENABLED !== 'false';

export const paymentStatusLabel = status => ({
  work_completed: 'Work Completed', payment_pending: 'Payment Pending', cash_pending: 'Cash Pending',
  cash_received: 'Cash Received', paid: 'Payment Completed',
  pending: 'Payment Pending', failed: 'Payment Failed', held: 'Escrow Locked',
  escrow_locked: 'Escrow Locked', released: 'Payment Released', refunded: 'Refunded',
  not_required: 'Not Required (Development)',
}[String(status || '').toLowerCase()] || String(status || 'Payment Pending').replaceAll('_', ' '));
