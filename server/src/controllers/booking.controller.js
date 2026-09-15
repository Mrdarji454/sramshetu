import { BookingService } from '../services/booking.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const createBooking = asyncHandler(async (req, res) => {
  const customerId = req.user._id || req.user.id;
  const booking = await BookingService.createBooking(customerId, req.body);
  return successResponse(res, booking, 'Booking request created successfully', 201);
});

export const getSuitableCooperativesAndWorkers = asyncHandler(async (req, res) => {
  const { serviceId, trade, city, pincode } = req.query;
  const data = await BookingService.getSuitableCooperativesAndWorkers({
    serviceId,
    trade,
    city,
    pincode,
  });
  return successResponse(res, data, 'Suitable cooperatives and artisans retrieved', 200);
});

export const getBookings = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const role = req.user.role;
  const { status, search } = req.query;
  const cooperativeId = req.user.cooperativeId;

  const bookings = await BookingService.getBookings({
    userId,
    role,
    status,
    cooperativeId,
    search,
  });

  return successResponse(res, bookings, 'Bookings retrieved successfully', 200);
});

export const getBookingById = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const role = req.user.role;
  const { id } = req.params;

  const booking = await BookingService.getBookingById(id, userId, role);
  return successResponse(res, booking, 'Booking details retrieved', 200);
});

export const assignWorker = asyncHandler(async (req, res) => {
  const cooperativeUserId = req.user.cooperativeId || req.user._id || req.user.id;
  const role = req.user.role;
  const { id } = req.params;
  const { workerId } = req.body;

  const updated = await BookingService.assignWorker(id, workerId, cooperativeUserId, role);
  return successResponse(res, updated, 'Artisan assigned successfully to booking', 200);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const role = req.user.role;
  const { id } = req.params;
  const { status, note, rejectionReason } = req.body;

  const updated = await BookingService.updateBookingStatus(id, status, userId, role, {
    note,
    rejectionReason,
  });

  return successResponse(res, updated, `Booking status updated to ${status}`, 200);
});

export const acceptBooking = asyncHandler(async (req, res) => {
  const workerUserId = req.user._id || req.user.id;
  const { id } = req.params;

  const updated = await BookingService.acceptBooking(id, workerUserId);
  return successResponse(res, updated, 'Assignment accepted by artisan', 200);
});

export const rejectBooking = asyncHandler(async (req, res) => {
  const workerUserId = req.user._id || req.user.id;
  const { id } = req.params;
  const { reason } = req.body;

  const updated = await BookingService.rejectBooking(id, workerUserId, reason);
  return successResponse(res, updated, 'Assignment declined by artisan', 200);
});

