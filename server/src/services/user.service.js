import { User } from '../models/User.model.js';
import { Booking } from '../models/Booking.model.js';
import { BookingService } from './booking.service.js';
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
    return BookingService.getBookings({
      userId,
      role: 'USER',
    });
  }
}

