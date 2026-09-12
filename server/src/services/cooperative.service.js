import { Cooperative } from '../models/Cooperative.model.js';
import { WorkerProfile } from '../models/WorkerProfile.model.js';
import { Booking } from '../models/Booking.model.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export class CooperativeService {
  static async getMembers(cooperativeId) {
    if (mongoose.connection.readyState === 1) {
      return WorkerProfile.find({ cooperativeId }).populate('userId', 'name phone email avatar');
    }
    return [
      {
        id: 'W-MH-4019',
        name: 'Rajeshwar Shinde',
        trade: 'Electrical & Power Systems',
        dailyFloorRate: 1300,
        status: 'busy',
        rating: 4.94,
      },
      {
        id: 'W-MH-3312',
        name: 'Vikas Kadam',
        trade: 'Plumbing & Water Sanitation',
        dailyFloorRate: 1150,
        status: 'available',
        rating: 4.91,
      },
    ];
  }

  static async getIncomingRequests(cooperativeId) {
    if (mongoose.connection.readyState === 1) {
      return Booking.find({ cooperativeId, status: 'pending' });
    }
    return [
      {
        id: 'REQ-MH-9901',
        customerName: 'Priya Sharma',
        service: 'Commercial 3-Phase Transformer Maintenance',
        budgetFloor: '₹1,800',
        urgency: 'Immediate',
        status: 'pending',
      },
    ];
  }

  static async assignWorker(bookingId, workerId) {
    if (mongoose.connection.readyState === 1) {
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        { workerId, status: 'assigned' },
        { new: true }
      );
      if (!booking) {
        throw new AppError('Booking request not found', 404);
      }
      return booking;
    }
    return {
      bookingId,
      workerId,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
    };
  }
}

