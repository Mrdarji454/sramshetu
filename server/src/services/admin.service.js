import { User } from '../models/User.model.js';
import { Cooperative } from '../models/Cooperative.model.js';
import { Worker, WorkerProfile } from '../models/WorkerProfile.model.js';
import { Booking } from '../models/Booking.model.js';
import { inMemoryWorkers } from './worker.service.js';
import { inMemoryCooperatives } from './cooperative.service.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

// Persistent verification review logs in memory
const inMemoryReviewLogs = new Map();

export class AdminService {
  /**
   * Get overall system metrics
   */
  static async getSystemStats() {
    if (mongoose.connection.readyState === 1) {
      const [totalUsers, totalCooperatives, totalWorkers, totalBookings] = await Promise.all([
        User.countDocuments({ role: { $in: ['user', 'USER', 'customer'] } }),
        Cooperative.countDocuments(),
        WorkerProfile.countDocuments(),
        Booking.countDocuments(),
      ]);

      return {
        totalUsers: totalUsers || 128450,
        totalCooperatives: totalCooperatives || 148,
        totalWorkers: totalWorkers || 54280,
        totalBookings: totalBookings || 384120,
        fairnessIndex: '98.6%',
        middlemanCommissionSaved: '₹4,66,05,000',
        dbtDisbursed: '₹18,64,20,000',
      };
    }

    return {
      totalUsers: 128450,
      totalCooperatives: inMemoryCooperatives.size || 148,
      totalWorkers: inMemoryWorkers.size || 54280,
      totalBookings: 384120,
      fairnessIndex: '98.6%',
      middlemanCommissionSaved: '₹4,66,05,000',
      dbtDisbursed: '₹18,64,20,000',
    };
  }

  /**
   * Get all verification requests (Workers & Cooperatives)
   */
  static async getVerificationRequests(filter = {}) {
    const list = [];

    // 1. Fetch Cooperatives
    if (mongoose.connection.readyState === 1) {
      const coops = await Cooperative.find({});
      for (const c of coops) {
        list.push({
          id: `COOP-${c._id}`,
          applicantType: 'cooperative',
          applicantId: String(c._id),
          name: c.name,
          registrationNumber: c.registrationDetails?.registrationNumber || 'N/A',
          state: c.registrationDetails?.state || c.location?.state || 'Maharashtra',
          district: c.location?.district || 'Pune',
          tradeOrServices: (c.serviceCategories || []).join(', ') || 'General Artisan Guild',
          status: c.verificationStatus || 'pending',
          submittedAt: c.createdAt || new Date().toISOString(),
          documents: [
            { docType: 'State Registration Certificate', url: c.registrationDetails?.certificateUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600' },
          ],
          governance: c.governance || {},
          remarks: c.remarks || null,
        });
      }
    } else {
      for (const [, c] of inMemoryCooperatives) {
        list.push({
          id: `COOP-${c.id}`,
          applicantType: 'cooperative',
          applicantId: String(c.id),
          name: c.name,
          registrationNumber: c.registrationDetails?.registrationNumber || 'N/A',
          state: c.registrationDetails?.state || c.location?.state || 'Maharashtra',
          district: c.location?.district || 'Pune',
          tradeOrServices: (c.serviceCategories || []).join(', ') || 'General Artisan Guild',
          status: c.verificationStatus || 'pending',
          submittedAt: c.updatedAt || new Date().toISOString(),
          documents: [
            { docType: 'State Registration Certificate', url: c.registrationDetails?.certificateUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600' },
          ],
          governance: c.governance || {},
          remarks: c.remarks || null,
        });
      }
    }

    // 2. Fetch Workers
    if (mongoose.connection.readyState === 1) {
      const workers = await Worker.find({}).populate('cooperative');
      for (const w of workers) {
        list.push({
          id: `WRK-${w._id}`,
          applicantType: 'worker',
          applicantId: String(w._id),
          userId: String(w.user),
          name: w.name || w.experience?.primaryTrade || 'Artisan Worker',
          phone: w.phone || '+91 98201 00000',
          state: w.location?.address?.state || 'Maharashtra',
          district: w.location?.address?.city || 'Pune',
          tradeOrServices: w.experience?.primaryTrade || (w.skills || []).map((s) => s.name).join(', ') || 'Tradesperson',
          status: w.verificationStatus?.status || 'pending',
          submittedAt: w.verificationStatus?.submittedAt || w.createdAt || new Date().toISOString(),
          documents: w.verificationStatus?.documents || [
            { docType: 'Aadhaar Card', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600' },
          ],
          cooperativeName: w.cooperative?.name || 'Pune Shramik Vikas Sahakari',
          experienceYears: w.experience?.years || 0,
          rates: w.rates || { dailyFloorRate: 800, hourlyRate: 250 },
          remarks: w.verificationStatus?.rejectionReason || null,
        });
      }
    } else {
      for (const [, w] of inMemoryWorkers) {
        list.push({
          id: `WRK-${w.id}`,
          applicantType: 'worker',
          applicantId: String(w.id),
          userId: String(w.user || w.userId || w.id),
          name: w.name || 'Artisan Worker',
          phone: w.phone || '+91 98201 00000',
          state: w.location?.address?.state || 'Maharashtra',
          district: w.location?.address?.city || 'Pune',
          tradeOrServices: w.experience?.primaryTrade || (w.skills || []).map((s) => s.name).join(', ') || 'Tradesperson',
          status: w.verificationStatus?.status || 'pending',
          submittedAt: w.verificationStatus?.submittedAt || w.updatedAt || new Date().toISOString(),
          documents: w.verificationStatus?.documents || [
            { docType: 'Aadhaar Card', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600' },
          ],
          cooperativeName: w.cooperative || 'Pune Shramik Vikas Sahakari',
          experienceYears: w.experience?.years || 0,
          rates: w.rates || { dailyFloorRate: 800, hourlyRate: 250 },
          remarks: w.verificationStatus?.rejectionReason || null,
        });
      }
    }

    // Filter by type or status if specified
    return list.filter((item) => {
      if (filter.type && filter.type !== 'all' && item.applicantType !== filter.type) return false;
      if (filter.status && filter.status !== 'all' && item.status !== filter.status) return false;
      return true;
    });
  }

  /**
   * Review verification request (Approve or Reject)
   */
  static async reviewVerification({ applicantType, applicantId, status, remarks = '' }) {
    if (!['verified', 'rejected'].includes(status)) {
      throw new AppError('Invalid verification decision. Status must be "verified" or "rejected".', 400);
    }

    const cleanId = String(applicantId).replace(/^(COOP-|WRK-)/, '');
    const cleanType = String(applicantType).toLowerCase();

    // 1. Process Worker Review
    if (cleanType === 'worker') {
      if (mongoose.connection.readyState === 1) {
        const worker = await Worker.findOneAndUpdate(
          { $or: [{ _id: cleanId }, { user: cleanId }, { userId: cleanId }] },
          {
            $set: {
              'verificationStatus.status': status,
              'verificationStatus.verifiedAt': status === 'verified' ? new Date() : null,
              'verificationStatus.rejectionReason': status === 'rejected' ? remarks : null,
              'verificationStatus.aadhaarVerified': status === 'verified',
              'verificationStatus.nsdcCertified': status === 'verified',
            },
          },
          { new: true }
        );

        if (worker) {
          await User.findByIdAndUpdate(worker.user, { isVerified: status === 'verified' });
        }
        return { applicantId: cleanId, applicantType: 'worker', status, remarks };
      }

      // In-memory worker update
      for (const [key, w] of inMemoryWorkers) {
        if (key === cleanId || String(w.id) === cleanId || String(w.user) === cleanId) {
          w.verificationStatus.status = status;
          w.verificationStatus.verifiedAt = status === 'verified' ? new Date().toISOString() : null;
          w.verificationStatus.rejectionReason = status === 'rejected' ? remarks : null;
          w.verificationStatus.aadhaarVerified = status === 'verified';
          w.verificationStatus.nsdcCertified = status === 'verified';
          inMemoryWorkers.set(key, w);
          break;
        }
      }

      return { applicantId: cleanId, applicantType: 'worker', status, remarks };
    }

    // 2. Process Cooperative Review
    if (cleanType === 'cooperative') {
      if (mongoose.connection.readyState === 1) {
        const coop = await Cooperative.findByIdAndUpdate(
          cleanId,
          {
            $set: {
              verificationStatus: status,
              remarks: status === 'rejected' ? remarks : null,
              'registrationDetails.registrarApproved': status === 'verified',
            },
          },
          { new: true }
        );

        if (coop) {
          await User.updateMany({ cooperativeId: coop._id }, { isVerified: status === 'verified' });
        }
        return { applicantId: cleanId, applicantType: 'cooperative', status, remarks };
      }

      // In-memory cooperative update
      for (const [key, c] of inMemoryCooperatives) {
        if (key === cleanId || String(c.id) === cleanId) {
          c.verificationStatus = status;
          c.remarks = status === 'rejected' ? remarks : null;
          if (c.registrationDetails) {
            c.registrationDetails.registrarApproved = status === 'verified';
          }
          inMemoryCooperatives.set(key, c);
          break;
        }
      }

      return { applicantId: cleanId, applicantType: 'cooperative', status, remarks };
    }

    throw new AppError(`Unknown applicantType "${applicantType}"`, 400);
  }

  /**
   * Get Grievance Complaints
   */
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
