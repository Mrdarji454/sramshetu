import { User } from '../models/User.model.js';
import { Booking } from '../models/Booking.model.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export class UserService {
  static async getProfile(userId) {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return user;
    }
    return {
      id: userId,
      name: 'Ananya Deshmukh',
      phone: '+91 98450 12890',
      role: 'user',
      city: 'Pune, Maharashtra',
      escrowLocked: 1850,
    };
  }

  static async getBookings(userId) {
    if (mongoose.connection.readyState === 1) {
      return Booking.find({ customerId: userId }).sort({ createdAt: -1 });
    }
    return [
      {
        id: 'BK-2026-8801',
        serviceName: 'Emergency Concealed Wiring Repair',
        status: 'in_progress',
        escrowAmount: 900,
        escrowStatus: 'held',
      },
    ];
  }
}

