import { Router } from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { Notification, NOTIFICATION_TYPES } from '../models/Notification.model.js';
import { recipientScope, publishNotificationChange } from '../services/notification.service.js';

const router = Router();
// Unlike legacy demo endpoints, notification APIs always require a live database.
router.use((req, res, next) => next(mongoose.connection.readyState === 1 ? undefined : new AppError('Notifications temporarily unavailable', 503)));
router.use(protect);
router.get('/', asyncHandler(async (req, res) => {
  const scope = recipientScope(req.user);
  const filter = { ...scope };
  const category = req.query.filter || 'All';
  if (!['All', 'Unread', 'Booking', 'Payment', 'Verification'].includes(category)) throw new AppError('Invalid notification filter', 400);
  if (category === 'Unread') filter.isRead = false;
  else if (category !== 'All') filter.type = { $in: Object.keys(NOTIFICATION_TYPES).filter(type => NOTIFICATION_TYPES[type] === category) };
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(limit) || limit < 1 || limit > 50) throw new AppError('Invalid pagination', 400);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter), Notification.countDocuments({ ...scope, isRead: false }),
  ]);
  return successResponse(res, { notifications, total, unreadCount, page, limit });
}));
router.get('/unread-count', asyncHandler(async (req, res) => successResponse(res, { unreadCount: await Notification.countDocuments({ ...recipientScope(req.user), isRead: false }) })));
router.patch('/read-all', asyncHandler(async (req, res) => {
  const scope = recipientScope(req.user);
  await Notification.updateMany({ ...scope, isRead: false }, { $set: { isRead: true } });
  publishNotificationChange(scope, 'notifications:changed', {});
  return successResponse(res, { unreadCount: await Notification.countDocuments({ ...scope, isRead: false }) });
}));
router.patch('/:id/read', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Invalid notification ID', 400);
  const scope = recipientScope(req.user);
  const notification = await Notification.findOneAndUpdate({ ...scope, _id: req.params.id }, { $set: { isRead: true } }, { new: true });
  if (!notification) throw new AppError('Notification not found', 404);
  publishNotificationChange(scope, 'notifications:changed', {});
  return successResponse(res, notification);
}));
export default router;
