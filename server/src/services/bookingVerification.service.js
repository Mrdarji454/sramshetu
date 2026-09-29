import { randomInt, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.model.js';
import { BookingService, normalizeStatus, normalizeRole } from './booking.service.js';
import { AppError } from '../utils/AppError.js';
import { bookingNotification } from './notification.service.js';
import { markWorkCompletedForPayment } from './payment.service.js';

const stages = { start: ['ON_THE_WAY', 'IN_PROGRESS', 'startOTP'], end: ['IN_PROGRESS', 'COMPLETED', 'endOTP'] };
const hash = (code, salt) => scryptSync(code, salt, 32).toString('hex');
const validStageStatus = (status, required) => normalizeStatus(status) === required || (required === 'ON_THE_WAY' && normalizeStatus(status) === 'ARRIVED');

export function publicBooking(value) {
  const data = value.toObject ? value.toObject({ virtuals: true }) : structuredClone(value);
  delete data.startOTP;
  delete data.endOTP;
  delete data.otpCode;
  if (data.qrVerification) delete data.qrVerification.otpCode;
  return data;
}

export async function issueWorkOtp(id, stage, actor, role) {
  if (!stages[stage]) throw new AppError('Unknown verification stage', 400);
  const booking = await BookingService.getBookingById(id, actor, role);
  if (normalizeRole(role) !== 'USER') throw new AppError('Only the booking customer may request a code', 403);
  const [required, , field] = stages[stage];
  if (!validStageStatus(booking.status, required)) throw new AppError('Verification is not available at this stage', 409);
  if (stage === 'end' && !booking.startOTP?.usedAt) throw new AppError('Start OTP verification is required before completion', 409);
  const previous = booking[field];
  if (previous?.issuedAt && Date.now() - new Date(previous.issuedAt).getTime() < 30000) throw new AppError('Wait 30 seconds before requesting another code', 429);
  let code;
  do { code = String(randomInt(100000, 1000000)); } while ([previous, booking.startOTP].some(old => old?.salt && old.hash === hash(code, old.salt)));
  const salt = randomBytes(16).toString('hex');
  const otp = { salt, hash: hash(code, salt), issuedAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0, usedAt: null };
  if (mongoose.connection.readyState === 1) {
    const saved = await Booking.findOneAndUpdate({
      _id: booking._id, status: booking.status,
      $or: [{ [`${field}.issuedAt`]: { $exists: false } }, { [`${field}.issuedAt`]: { $lte: new Date(Date.now() - 30000) } }],
    }, { $set: { [field]: otp } });
    if (!saved) throw new AppError('Booking changed or a code was just issued; refresh and retry', 409);
  } else booking[field] = otp;
  await bookingNotification(booking, 'OTP_GENERATED');
  return { code, expiresAt: otp.expiresAt, stage };
}

export async function verifyWorkOtp(id, stage, code, actor, role) {
  if (!stages[stage] || !/^\d{6}$/.test(String(code))) throw new AppError('Enter the six-digit customer code', 400);
  const booking = await BookingService.getBookingById(id, actor, role);
  if (normalizeRole(role) !== 'WORKER') throw new AppError('Only the assigned worker may verify a code', 403);
  const [required, next, field] = stages[stage];
  if (stage === 'end' && !booking.startOTP?.usedAt) throw new AppError('Start OTP verification is required before completion', 409);
  const otp = booking[field];
  if (!validStageStatus(booking.status, required) || !otp?.hash || otp.usedAt || new Date(otp.expiresAt) <= new Date() || otp.attempts >= 5) throw new AppError('Code unavailable, expired, used, or locked. Ask the customer for a new code.', 409);
  const valid = timingSafeEqual(Buffer.from(otp.hash, 'hex'), Buffer.from(hash(String(code), otp.salt), 'hex'));
  const filter = { _id: booking._id, status: booking.status, [`${field}.hash`]: otp.hash, [`${field}.usedAt`]: null, [`${field}.attempts`]: { $lt: 5 }, [`${field}.expiresAt`]: { $gt: new Date() } };
  if (!valid) {
    if (mongoose.connection.readyState === 1) await Booking.updateOne(filter, { $inc: { [`${field}.attempts`]: 1 } });
    else otp.attempts += 1;
    throw new AppError('Incorrect code', 400);
  }
  const event = { status: next, updatedBy: actor, role: 'WORKER', timestamp: new Date(), note: `${stage === 'start' ? 'Arrival' : 'Completion'} verified by customer code` };
  const fields = { status: next, trackingStatus: next, [`${field}.usedAt`]: new Date() };
  if (stage === 'end') {
    fields['qrVerification.isVerified'] = true;
    fields['qrVerification.verifiedAt'] = new Date();
    fields.paymentStatus = 'WORK_COMPLETED';
  }
  if (mongoose.connection.readyState === 1) {
    const saved = await Booking.findOneAndUpdate(filter, { $set: fields, $push: { statusHistory: event, timelineEvents: event } }, { new: true });
    if (!saved) throw new AppError('Code already consumed or booking changed', 409);
    if (stage === 'end') await markWorkCompletedForPayment(saved);
    const completedBooking = stage === 'end' ? await Booking.findById(saved._id) : saved;
    await bookingNotification(completedBooking, next);
    await bookingNotification(completedBooking, stage === 'start' ? 'START_OTP_VERIFIED' : 'END_OTP_VERIFIED');
    if (stage === 'end') await bookingNotification(completedBooking, 'PAYMENT_PENDING', `payment-unlocked:${completedBooking._id}`);
    return publicBooking(completedBooking);
  }
  booking.status = next;
  booking.trackingStatus = next;
  otp.usedAt = new Date();
  if (stage === 'end') {
    booking.paymentStatus = 'WORK_COMPLETED';
    booking.qrVerification ||= {};
    booking.qrVerification.isVerified = true;
    booking.qrVerification.verifiedAt = new Date();
  }
  (booking.statusHistory ||= []).push(event);
  (booking.timelineEvents ||= []).push(event);
  return publicBooking(booking);
}
