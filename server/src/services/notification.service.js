import mongoose from 'mongoose';
import { Notification } from '../models/Notification.model.js';
import { User } from '../models/User.model.js';
import { Worker } from '../models/Worker.model.js';

export const notificationRole = role => String(role).toUpperCase() === 'CUSTOMER' ? 'USER' : String(role).toUpperCase();
export const notificationRoom = (id, role) => `notifications:${notificationRole(role)}:${id}`;
export const recipientScope = user => ({ recipientId: user._id || user.id, recipientRole: notificationRole(user.role) });
let realtime;
export function setNotificationTransport(io) { realtime = io; }
// Future SMS/email adapters receive only persisted notifications. Register a queueing adapter,
// keeping provider credentials and delivery retries outside the business services.
const channels = new Map();
export function registerNotificationChannel(name, deliver) { channels.set(name, deliver); }
export function publishNotificationChange(scope, event, payload) {
  realtime?.to(notificationRoom(scope.recipientId, scope.recipientRole)).emit(event, payload);
}

export async function notify({ recipientId, recipientRole, type, title, message, relatedBooking, eventKey }) {
  if (!recipientId) return null;
  const scope = { recipientId, recipientRole: notificationRole(recipientRole) };
  let doc;
  try {
    doc = await Notification.create({ ...scope, type, title, message, relatedBooking, ...(eventKey && { eventKey }) });
  } catch (error) {
    if (error.code === 11000 && eventKey) return null;
    throw error;
  }
  publishNotificationChange(scope, 'notification:new', doc.toObject());
  publishNotificationChange(scope, 'notifications:changed', {});
  for (const [name, deliver] of channels) {
    try { await deliver(doc.toObject()); }
    catch (error) { console.error(`[Notifications] ${name} delivery failed`, error.message); }
  }
  return doc;
}

// Notification failure must not turn an already-committed booking into a failed API response.
// No in-memory fallback: MongoDB is the durable source of truth.
export async function safelyNotify(work) {
  if (mongoose.connection.readyState !== 1) return;
  try { await work(); } catch (error) { console.error('[Notifications] Delivery failed:', error.message); }
}
const ref = value => value?._id || value;
export async function notifyWorker(workerId, payload) {
  if (!workerId) return;
  const worker = await Worker.findOne({ $or: [{ _id: ref(workerId) }, { user: ref(workerId) }] });
  const user = await User.findOne({ _id: ref(worker?.user || workerId), role: { $in: ['WORKER', 'worker'] }, isActive: true });
  if (user) await notify({ ...payload, recipientId: user._id, recipientRole: 'WORKER' });
}
export async function notifyCooperative(cooperativeId, payload) {
  if (!cooperativeId) return;
  const users = await User.find({ $or: [{ cooperativeId: ref(cooperativeId) }, { _id: ref(cooperativeId) }], role: { $in: ['COOPERATIVE', 'cooperative'] }, isActive: true });
  for (const user of users) await notify({ ...payload, recipientId: user._id, recipientRole: 'COOPERATIVE' });
}
export async function notifyAdmins(payload) {
  const users = await User.find({ role: { $in: ['ADMIN', 'admin'] }, isActive: true });
  for (const user of users) await notify({ ...payload, recipientId: user._id, recipientRole: 'ADMIN' });
}

const titles = {
  BOOKING_SUBMITTED: 'Booking request submitted', NEW_BOOKING: 'New booking request', ASSIGNED: 'Worker assigned',
  COOPERATIVE_ASSIGNED: 'Cooperative assigned',
  ACCEPTED: 'Worker accepted booking', REJECTED: 'Worker rejected assignment', ON_THE_WAY: 'Worker is en route',
  ARRIVED: 'Worker arrived', IN_PROGRESS: 'Work started', COMPLETED: 'Work completed', CANCELLED: 'Booking cancelled',
  RESCHEDULED: 'Booking rescheduled', OTP_GENERATED: 'Work verification code generated',
  DISPUTED: 'Booking disputed',
  START_OTP_VERIFIED: 'Start-work OTP verified', END_OTP_VERIFIED: 'End-work OTP verified',
  RATING_REMINDER: 'How was your service?', PAYMENT_RELEASED: 'Payment released',
  PAYMENT_CONFIRMED: 'Payment confirmed', SETTLEMENT_COMPLETED: 'Payment settlement completed',
};
export async function bookingNotification(booking, type, eventKey) {
  return safelyNotify(async () => {
    const payload = { type, title: titles[type] || type, message: `${titles[type] || type} for ${booking.serviceName || 'your service booking'}.`, relatedBooking: ref(booking), eventKey };
    const customer = () => notify({ ...payload, recipientId: ref(booking.customer || booking.customerId), recipientRole: 'USER' });
    const worker = () => notifyWorker(booking.worker || booking.workerId, type === 'ASSIGNED' ? { ...payload, title: 'New job assignment', message: `You have been assigned ${booking.serviceName || 'a service booking'}. Review the booking to accept or reject it.` } : payload);
    const cooperative = () => notifyCooperative(booking.cooperative || booking.cooperativeId, payload);
    if (['START_OTP_VERIFIED', 'END_OTP_VERIFIED', 'PAYMENT_RELEASED'].includes(type)) await worker();
    else if (type === 'SETTLEMENT_COMPLETED') await cooperative();
    else if (type === 'NEW_BOOKING') { await worker(); await cooperative(); }
    else if (type !== 'DISPUTED') {
      await customer();
      if (['ASSIGNED', 'CANCELLED', 'RESCHEDULED'].includes(type)) await worker();
      if (['ACCEPTED', 'REJECTED', 'CANCELLED', 'RESCHEDULED'].includes(type)) await cooperative();
    }
    if (type === 'COMPLETED') await bookingNotification(booking, 'RATING_REMINDER', `rating:${ref(booking)}`);
    if (type === 'DISPUTED') await notifyAdmins({ ...payload, type: 'COMPLAINT_SUBMITTED', title: 'Booking complaint submitted', message: 'A disputed booking needs administrator review.' });
  });
}
