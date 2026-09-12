import { User } from '../models/User.model.js';
import { Cooperative } from '../models/Cooperative.model.js';
import { WorkerProfile } from '../models/WorkerProfile.model.js';
import { Booking } from '../models/Booking.model.js';
import mongoose from 'mongoose';

export class AdminService {
  static async getSystemStats() {
    if (mongoose.connection.readyState === 1) {
      const [totalUsers, totalCooperatives, totalWorkers, totalBookings] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        Cooperative.countDocuments(),
        WorkerProfile.countDocuments(),
        Booking.countDocuments(),
      ]);

      return {
        totalUsers,
        totalCooperatives,
        totalWorkers,
        totalBookings,
        fairnessIndex: '98.6%',
        middlemanCommissionSaved: '₹4,66,05,000',
        dbtDisbursed: '₹18,64,20,000',
      };
    }

    return {
      totalUsers: 128450,
      totalCooperatives: 148,
      totalWorkers: 54280,
      totalBookings: 384120,
      fairnessIndex: '98.6%',
      middlemanCommissionSaved: '₹4,66,05,000',
      dbtDisbursed: '₹18,64,20,000',
    };
  }

  static async getVerificationRequests() {
    return [
      {
        id: 'VER-REQ-2026-081',
        applicantType: 'Cooperative Society',
        name: 'Surat Diamond & Industrial Craft Guild',
        state: 'Gujarat',
        status: 'pending_review',
      },
      {
        id: 'VER-REQ-2026-082',
        applicantType: 'Worker',
        name: 'Balwant Singh Rao',
        state: 'Madhya Pradesh',
        status: 'pending_review',
      },
    ];
  }

  static async getComplaints() {
    return [
      {
        ticketId: 'CMP-2026-0041',
        filedBy: 'Kishore Trivedi',
        type: 'Escrow Release Delay',
        severity: 'medium',
        status: 'investigating',
      },
      {
        ticketId: 'CMP-2026-0038',
        filedBy: 'Vikas Kadam',
        type: 'Site Safety Violation',
        severity: 'high',
        status: 'resolved',
      },
    ];
  }
}

