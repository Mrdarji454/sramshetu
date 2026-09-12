import { WorkerProfile } from '../models/WorkerProfile.model.js';
import { Booking } from '../models/Booking.model.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export class WorkerService {
  static async getProfile(userId) {
    if (mongoose.connection.readyState === 1) {
      const profile = await WorkerProfile.findOne({ userId }).populate('cooperativeId');
      if (!profile) {
        throw new AppError('Worker profile not found for this user', 404);
      }
      return profile;
    }
    return {
      userId,
      trade: 'Master Industrial Electrician',
      rating: 4.94,
      dailyFloorRate: 1300,
      availabilityStatus: 'available',
      cooperative: 'Pune Shramik Vikas Sahakari',
    };
  }

  static async updateAvailability(userId, { status, workingRadiusKm }) {
    if (mongoose.connection.readyState === 1) {
      const profile = await WorkerProfile.findOneAndUpdate(
        { userId },
        { availabilityStatus: status, workingRadiusKm },
        { new: true, runValidators: true }
      );
      if (!profile) {
        throw new AppError('Worker profile not found', 404);
      }
      return profile;
    }
    return {
      userId,
      availabilityStatus: status || 'available',
      workingRadiusKm: workingRadiusKm || 12,
    };
  }

  static async getAssignedJobs(userId) {
    if (mongoose.connection.readyState === 1) {
      return Booking.find({ workerId: userId, status: { $in: ['assigned', 'in_progress'] } });
    }
    return [
      {
        id: 'BK-2026-8801',
        serviceName: 'Emergency Concealed Wiring Repair',
        status: 'in_progress',
        escrowAmount: 900,
        rateGuaranteed: '₹450 / hr (Min 2 hrs = ₹900)',
      },
    ];
  }
}

