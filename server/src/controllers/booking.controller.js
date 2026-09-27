import { publicBooking, issueWorkOtp, verifyWorkOtp } from '../services/bookingVerification.service.js';
import { BookingService } from '../services/booking.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const createBooking = asyncHandler(async (req, res) => {
  const customerId = req.user._id || req.user.id;
  const booking = await BookingService.createBooking(customerId, req.body);
  return successResponse(res, publicBooking(booking), 'Booking request created successfully', 201);
});

export const getSuitableCooperativesAndWorkers = asyncHandler(async (req, res) => {
  const { serviceId, trade, city, pincode } = req.query;
  const data = await BookingService.getSuitableCooperativesAndWorkers({
    serviceId,
    trade,
    city,
    pincode,
    latitude: req.query.latitude,
    longitude: req.query.longitude,
  });
  return successResponse(res, data, 'Suitable cooperatives and artisans retrieved', 200);
});

export const getBookings = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const role = req.user.role;
  const { status, search } = req.query;
  let cooperativeId = req.user.cooperativeId;

  // If cooperative role but no cooperativeId set, try to resolve it
  if (!cooperativeId && role && role.toUpperCase() === 'COOPERATIVE') {
    cooperativeId = userId; // Use userId as cooperativeId fallback
  }

  const bookings = await BookingService.getBookings({
    userId,
    role,
    status,
    cooperativeId,
    search,
  });

  return successResponse(res, bookings.map(publicBooking), 'Bookings retrieved successfully', 200);
});

export const getBookingById = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const role = req.user.role;
  const { id } = req.params;

  const booking = await BookingService.getBookingById(id, userId, role);
  return successResponse(res, publicBooking(booking), 'Booking details retrieved', 200);
});

export const assignWorker = asyncHandler(async (req, res) => {
  const role = req.user.role;
  let cooperativeUserId = req.user.cooperativeId || req.user._id || req.user.id;

  // Ensure cooperative role users always have a valid cooperative reference
  if (!req.user.cooperativeId && role && role.toUpperCase() === 'COOPERATIVE') {
    cooperativeUserId = req.user._id || req.user.id;
  }

  const { id } = req.params;
  const { workerId } = req.body;

  const updated = await BookingService.assignWorker(id, workerId, cooperativeUserId, role);
  return successResponse(res, publicBooking(updated), 'Artisan assigned successfully to booking', 200);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const role = req.user.role;
  const { id } = req.params;
  const { status, note, rejectionReason } = req.body;

  const updated = await BookingService.updateBookingStatus(id, status, userId, role, {
    note,
    rejectionReason,
    scheduledTime: req.body.scheduledTime,
  });

  return successResponse(res, publicBooking(updated), `Booking status updated to ${status}`, 200);
});

export const acceptBooking = asyncHandler(async (req, res) => {
  const workerUserId = req.user._id || req.user.id;
  const { id } = req.params;

  const updated = await BookingService.acceptBooking(id, workerUserId);
  return successResponse(res, publicBooking(updated), 'Assignment accepted by artisan', 200);
});

export const rejectBooking = asyncHandler(async (req, res) => {
  const workerUserId = req.user._id || req.user.id;
  const { id } = req.params;
  const { reason } = req.body;

  const updated = await BookingService.rejectBooking(id, workerUserId, reason);
  return successResponse(res, publicBooking(updated), 'Assignment declined by artisan', 200);
});


export const issueOtp = stage => asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  return successResponse(res, await issueWorkOtp(req.params.id, stage, req.user._id || req.user.id, req.user.role));
});
export const verifyOtp = stage => asyncHandler(async (req, res) => {
  return successResponse(res, await verifyWorkOtp(req.params.id, stage, req.body.code, req.user._id || req.user.id, req.user.role));
});
