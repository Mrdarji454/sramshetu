import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = {
  BOOKING_SUBMITTED: 'Booking', ASSIGNED: 'Booking', COOPERATIVE_ASSIGNED: 'Booking', NEW_BOOKING: 'Booking',
  ACCEPTED: 'Booking', REJECTED: 'Booking', ON_THE_WAY: 'Booking', ARRIVED: 'Booking',
  IN_PROGRESS: 'Booking', COMPLETED: 'Booking', CANCELLED: 'Booking', RESCHEDULED: 'Booking', DISPUTED: 'Booking',
  OTP_GENERATED: 'Booking', START_OTP_VERIFIED: 'Booking', END_OTP_VERIFIED: 'Booking', RATING_REMINDER: 'Booking',
  PAYMENT_CONFIRMED: 'Payment', PAYMENT_RELEASED: 'Payment', SETTLEMENT_COMPLETED: 'Payment',
  VERIFICATION_APPROVED: 'Verification', VERIFICATION_REJECTED: 'Verification', DOCUMENT_EXPIRY: 'Verification',
  VERIFICATION_PENDING: 'Verification', WORKER_REGISTERED: 'Verification', COOPERATIVE_REGISTERED: 'Verification',
  WORKER_JOINED: 'Booking', WORKER_UNAVAILABLE: 'Booking',
  HIGH_DEMAND: 'System', WORKER_SHORTAGE: 'System', COMPLAINT_SUBMITTED: 'System', API_FAILURE: 'System',
};

const schema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientRole: { type: String, enum: ['USER', 'WORKER', 'COOPERATIVE', 'ADMIN'], required: true },
  title: { type: String, required: true, maxlength: 160 },
  message: { type: String, required: true, maxlength: 1000 },
  type: { type: String, enum: Object.keys(NOTIFICATION_TYPES), required: true },
  relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  eventKey: { type: String },
}, { bufferCommands: false });
schema.index({ recipientId: 1, recipientRole: 1, createdAt: -1, _id: -1 });
schema.index({ recipientId: 1, recipientRole: 1, isRead: 1, createdAt: -1 });
schema.index({ recipientId: 1, eventKey: 1 }, { unique: true, partialFilterExpression: { eventKey: { $type: 'string' } } });
export const Notification = mongoose.model('Notification', schema);
