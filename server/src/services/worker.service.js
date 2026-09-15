import { Worker, WorkerProfile } from '../models/WorkerProfile.model.js';
import { User } from '../models/User.model.js';
import { Cooperative } from '../models/Cooperative.model.js';
import { Booking } from '../models/Booking.model.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

// In-memory worker store for offline development and testing
export const inMemoryWorkers = new Map();

// Initialize realistic default worker for testing
const defaultWorkerId = '65f123456789012345678902';
inMemoryWorkers.set(defaultWorkerId, {
  id: defaultWorkerId,
  _id: defaultWorkerId,
  user: defaultWorkerId,
  userId: defaultWorkerId,
  name: 'Rajeshwar Shinde',
  phone: '+919820144019',
  trade: 'Master Industrial Electrician',
  experience: {
    years: 8,
    primaryTrade: 'Electrical & Power Systems',
    subTrades: ['Concealed Wiring', 'Solar Inverter', '3-Phase Substation Tech'],
    bio: 'Government licensed Grade-A wireman with over 8 years experience in residential and heavy commercial electrical infrastructure.',
  },
  skills: [
    { name: 'Concealed Wiring', category: 'Electrical', nsdcLevel: 'Level 4', isPrimary: true },
    { name: 'Solar Inverter', category: 'Renewable', nsdcLevel: 'Level 3', isPrimary: false },
    { name: 'DB Dressing & Busbar', category: 'Industrial', nsdcLevel: 'Level 4', isPrimary: false },
  ],
  rates: {
    dailyFloorRate: 1300,
    hourlyRate: 450,
    currency: 'INR',
  },
  location: {
    address: {
      street: 'Flat 402, Green Meadows, Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
    },
    workingRadiusKm: 15,
    coordinates: [73.8058, 18.5074],
  },
  availability: {
    status: 'available',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    hours: { start: '08:00', end: '18:00' },
  },
  verificationStatus: {
    status: 'verified',
    aadhaarVerified: true,
    nsdcCertified: true,
    policeVerification: 'cleared',
    verifiedAt: new Date().toISOString(),
    documents: [
      { docType: 'Aadhaar Card', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600', verified: true },
      { docType: 'NSDC Skill Certificate', url: 'https://images.unsplash.com/photo-1589330694653-dad6ef0140be?w=600', verified: true },
    ],
  },
  rating: { average: 4.94, count: 84 },
  cooperative: 'Pune Shramik Vikas Sahakari',
  cooperativeId: '65f123456789012345678903',
  jobsCompleted: 462,
});

export class WorkerService {
  /**
   * Get worker profile by User ID
   */
  static async getProfile(userId) {
    const cleanId = String(userId);

    if (mongoose.connection.readyState === 1) {
      let profile = await Worker.findOne({
        $or: [{ user: cleanId }, { userId: cleanId }],
      }).populate('cooperative');

      if (!profile) {
        // Return default empty onboarding template if profile not created yet
        const user = await User.findById(cleanId);
        return {
          user: cleanId,
          userId: cleanId,
          name: user?.name || 'Worker',
          phone: user?.phone || '',
          experience: { years: 0, primaryTrade: '', subTrades: [], bio: '' },
          skills: [],
          rates: { dailyFloorRate: 800, hourlyRate: 250 },
          location: { address: { street: '', city: '', state: '', pincode: '' }, workingRadiusKm: 15 },
          availability: { status: 'available', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], hours: { start: '09:00', end: '18:00' } },
          verificationStatus: { status: 'pending', aadhaarVerified: false, nsdcCertified: false, documents: [] },
          isNewProfile: true,
        };
      }
      return profile;
    }

    // In-memory lookup
    if (inMemoryWorkers.has(cleanId)) {
      return inMemoryWorkers.get(cleanId);
    }

    // Return empty profile template for newly registered worker in dev mode
    const template = {
      id: cleanId,
      _id: cleanId,
      user: cleanId,
      userId: cleanId,
      name: 'Artisan',
      experience: { years: 0, primaryTrade: 'General Maintenance', subTrades: [], bio: '' },
      skills: [],
      rates: { dailyFloorRate: 800, hourlyRate: 250 },
      location: { address: { street: '', city: 'Pune', state: 'Maharashtra', pincode: '411001' }, workingRadiusKm: 15 },
      availability: { status: 'available', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], hours: { start: '09:00', end: '18:00' } },
      verificationStatus: { status: 'pending', aadhaarVerified: false, nsdcCertified: false, documents: [] },
      isNewProfile: true,
    };
    inMemoryWorkers.set(cleanId, template);
    return template;
  }

  /**
   * Save or update worker onboarding data
   */
  static async saveOnboarding(userId, onboardingData) {
    const cleanId = String(userId);
    const {
      name,
      primaryTrade,
      subTrades = [],
      years = 0,
      bio = '',
      skills = [],
      dailyFloorRate = 800,
      hourlyRate = 250,
      address = {},
      workingRadiusKm = 15,
      availability = {},
      documents = [],
      cooperativeId,
      profileImage,
    } = onboardingData;

    // Normalization
    const formattedSkills = skills.map((s) => (typeof s === 'string' ? { name: s, isPrimary: true } : s));
    const tradeName = primaryTrade || 'General Technical';

    const updatePayload = {
      user: cleanId,
      userId: cleanId,
      skills: formattedSkills,
      experience: {
        years: Number(years) || 0,
        primaryTrade: tradeName,
        subTrades: Array.isArray(subTrades) ? subTrades : [subTrades],
        bio,
      },
      rates: {
        dailyFloorRate: Number(dailyFloorRate) || 800,
        hourlyRate: Number(hourlyRate) || 250,
        currency: 'INR',
      },
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204],
        address: {
          street: address.street || '',
          city: address.city || 'Pune',
          state: address.state || 'Maharashtra',
          pincode: address.pincode || '',
        },
        workingRadiusKm: Number(workingRadiusKm) || 15,
      },
      availability: {
        status: availability.status || 'available',
        workingDays: availability.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        hours: availability.hours || { start: '08:00', end: '18:00' },
      },
      verificationStatus: {
        status: 'pending',
        aadhaarVerified: false,
        nsdcCertified: formattedSkills.some((s) => s.nsdcLevel),
        policeVerification: 'pending',
        documents: documents || [],
        submittedAt: new Date().toISOString(),
      },
      cooperative: cooperativeId || null,
      cooperativeId: cooperativeId || null,
    };

    if (mongoose.connection.readyState === 1) {
      const profile = await Worker.findOneAndUpdate(
        { $or: [{ user: cleanId }, { userId: cleanId }] },
        { $set: updatePayload },
        { new: true, upsert: true, runValidators: true }
      );

      if (profileImage || name) {
        await User.findByIdAndUpdate(cleanId, {
          ...(profileImage && { profileImage }),
          ...(name && { name }),
          ...(cooperativeId && { cooperativeId }),
        });
      }

      return profile;
    }

    // In-memory persistence
    const existing = inMemoryWorkers.get(cleanId) || {};
    const updatedRecord = {
      ...existing,
      ...updatePayload,
      id: cleanId,
      _id: cleanId,
      name: name || existing.name || 'Worker',
      profileImage: profileImage || existing.profileImage || null,
      rating: existing.rating || { average: 5.0, count: 0 },
      jobsCompleted: existing.jobsCompleted || 0,
      isNewProfile: false,
      updatedAt: new Date().toISOString(),
    };

    inMemoryWorkers.set(cleanId, updatedRecord);
    return updatedRecord;
  }

  /**
   * Update worker availability status
   */
  static async updateAvailability(userId, { status, workingRadiusKm }) {
    const cleanId = String(userId);

    if (mongoose.connection.readyState === 1) {
      const updateFields = {};
      if (status) updateFields['availability.status'] = status;
      if (workingRadiusKm) updateFields['location.workingRadiusKm'] = workingRadiusKm;

      const profile = await Worker.findOneAndUpdate(
        { $or: [{ user: cleanId }, { userId: cleanId }] },
        { $set: updateFields },
        { new: true }
      );
      if (!profile) throw new AppError('Worker profile not found', 404);
      return profile;
    }

    const worker = await this.getProfile(cleanId);
    if (status) worker.availability.status = status;
    if (workingRadiusKm) worker.location.workingRadiusKm = workingRadiusKm;
    inMemoryWorkers.set(cleanId, worker);
    return worker;
  }

  /**
   * Upload and attach a document
   */
  static async uploadDocument(userId, { docType, url, name }) {
    const cleanId = String(userId);
    const newDoc = {
      docType: docType || 'Identity Proof',
      url: url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
      name: name || `${docType}.pdf`,
      uploadedAt: new Date().toISOString(),
      verified: false,
    };

    if (mongoose.connection.readyState === 1) {
      const profile = await Worker.findOneAndUpdate(
        { $or: [{ user: cleanId }, { userId: cleanId }] },
        { $push: { 'verificationStatus.documents': newDoc } },
        { new: true }
      );
      return profile?.verificationStatus?.documents || [newDoc];
    }

    const worker = await this.getProfile(cleanId);
    if (!worker.verificationStatus.documents) {
      worker.verificationStatus.documents = [];
    }
    worker.verificationStatus.documents.push(newDoc);
    inMemoryWorkers.set(cleanId, worker);
    return worker.verificationStatus.documents;
  }

  /**
   * Get verification status with checklist
   */
  static async getVerificationStatus(userId) {
    const profile = await this.getProfile(userId);
    const ver = profile.verificationStatus || { status: 'pending', documents: [] };

    const checklist = [
      { id: 'profile', title: 'Professional Profile Details', complete: Boolean(profile.experience?.primaryTrade) },
      { id: 'skills', title: 'Technical Skill Roster', complete: Boolean(profile.skills?.length > 0) },
      { id: 'location', title: 'Operational Working Area', complete: Boolean(profile.location?.address?.city) },
      { id: 'documents', title: 'KYC & Trade Identity Uploads', complete: Boolean(ver.documents?.length > 0) },
      { id: 'coop', title: 'Cooperative Endorsement', complete: Boolean(profile.cooperative || profile.cooperativeId) },
      { id: 'admin', title: 'State Registry Review', complete: ver.status === 'verified' },
    ];

    const completedCount = checklist.filter((c) => c.complete).length;

    return {
      status: ver.status || 'pending',
      aadhaarVerified: Boolean(ver.aadhaarVerified),
      nsdcCertified: Boolean(ver.nsdcCertified),
      policeVerification: ver.policeVerification || 'pending',
      verifiedAt: ver.verifiedAt || null,
      rejectionReason: ver.rejectionReason || null,
      documents: ver.documents || [],
      checklist,
      completionPercentage: Math.round((completedCount / checklist.length) * 100),
    };
  }

  /**
   * Get assigned jobs
   */
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
