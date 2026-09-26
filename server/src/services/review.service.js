import mongoose from 'mongoose';
import { Review } from '../models/Review.model.js';
import { Cooperative } from '../models/Cooperative.model.js';
import { Worker } from '../models/Worker.model.js';
import { BookingService, normalizeStatus } from './booking.service.js';
import { AppError } from '../utils/AppError.js';

export const memoryReviews = new Map();
const tagsAllowed = ['On Time', 'Skilled', 'Professional', 'Affordable', 'Friendly'];
const idOf = value => String(value?._id || value || '');
export async function submitReview(bookingId, customer, input) {
  const booking = await BookingService.getBookingById(bookingId, customer, 'USER');
  if (normalizeStatus(booking.status) !== 'COMPLETED') throw new AppError('Complete the booking before reviewing it', 409);
  const { rating, cooperativeRating, feedback = '', tags = [] } = input;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || typeof feedback !== 'string' || feedback.length > 1000 || !Array.isArray(tags) || tags.some(tag => !tagsAllowed.includes(tag))) throw new AppError('Invalid rating, feedback, or tags', 400);
  if (cooperativeRating != null && (!booking.cooperative || !Number.isInteger(cooperativeRating) || cooperativeRating < 1 || cooperativeRating > 5)) throw new AppError('Invalid cooperative rating', 400);
  const key = idOf(booking._id);
  let workerId = idOf(booking.worker);
  if (mongoose.connection.readyState === 1) {
    const worker = await Worker.findOne({ $or: [{ _id: workerId }, { user: workerId }] });
    if (!worker) throw new AppError('Assigned worker profile not found', 409);
    workerId = worker._id;
  }
  const data = { booking: key, customer, worker: workerId, cooperative: booking.cooperative ? idOf(booking.cooperative) : null, rating, cooperativeRating, feedback: feedback.trim(), comment: feedback.trim(), tags: [...new Set(tags)], isPublic: true };
  if (mongoose.connection.readyState === 1) {
    let review;
    try { review = await Review.create(data); } catch (error) {
      if (error.code === 11000) throw new AppError('This booking has already been reviewed', 409);
      throw error;
    }
    if (data.cooperative && cooperativeRating != null) {
      const stats = await Review.aggregate([
        { $match: { cooperative: new mongoose.Types.ObjectId(data.cooperative), cooperativeRating: { $exists: true }, isPublic: true } },
        { $group: { _id: null, average: { $avg: '$cooperativeRating' }, count: { $sum: 1 } } },
      ]);
      if (stats[0]) await Cooperative.findByIdAndUpdate(data.cooperative, { rating: { average: stats[0].average, count: stats[0].count } });
    }
    return review;
  }
  if (memoryReviews.has(key)) throw new AppError('This booking has already been reviewed', 409);
  const review = { ...data, _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date() };
  memoryReviews.set(key, review);
  const { inMemoryWorkers } = await import('./worker.service.js');
  const { inMemoryCooperatives } = await import('./cooperative.service.js');
  const worker = [...inMemoryWorkers.values()].find(w => idOf(w._id || w.id) === idOf(workerId) || idOf(w.user) === idOf(workerId));
  const workerReviews = [...memoryReviews.values()].filter(r => idOf(r.worker) === idOf(workerId));
  if (worker) worker.rating = { average: workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length, count: workerReviews.length };
  const coop = [...inMemoryCooperatives.values()].find(c => idOf(c._id || c.id) === data.cooperative);
  const coopReviews = [...memoryReviews.values()].filter(r => r.cooperative === data.cooperative && r.cooperativeRating != null);
  if (coop && coopReviews.length) coop.rating = { average: coopReviews.reduce((sum, r) => sum + r.cooperativeRating, 0) / coopReviews.length, count: coopReviews.length };
  return review;
}

export async function getBookingReview(id, customer) {
  const booking = await BookingService.getBookingById(id, customer, 'USER');
  return mongoose.connection.readyState === 1 ? Review.findOne({ booking: booking._id }) : memoryReviews.get(idOf(booking._id)) || null;
}
