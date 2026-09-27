export const paymentsEnabled = import.meta.env?.VITE_PAYMENTS_ENABLED === 'true';

export const paymentStatusLabel = status => ({
  pending: 'Payment Pending', failed: 'Payment Failed', held: 'Escrow Locked',
  escrow_locked: 'Escrow Locked', released: 'Payment Released', refunded: 'Refunded',
  not_required: 'Not Required (Development)',
}[String(status || '').toLowerCase()] || String(status || 'Payment Pending').replaceAll('_', ' '));
