import { Worker, WorkerProfile } from '../models/WorkerProfile.model.js';
import { User } from '../models/User.model.js';
import { Cooperative } from '../models/Cooperative.model.js';
import { Booking } from '../models/Booking.model.js';
import { BookingService } from './booking.service.js';
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
  latitude: 18.5074,
  longitude: 73.8058,
  serviceArea: {
    radiusKm: 15,
    city: 'Pune',
    pincodes: ['411038', '411004', '411052'],
  },
  location: {
    address: {
      street: 'Flat 402, Green Meadows, Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
    },
    workingRadiusKm: 15,
    latitude: 18.5074,
    longitude: 73.8058,
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

// Seed additional diverse artisans across Pune localities for location-based matching
const additionalSeedWorkers = [
  {
    id: '65f123456789012345678905',
    _id: '65f123456789012345678905',
    user: '65f123456789012345678905',
    name: 'Santosh Waghmare',
    phone: '+919820111223',
    trade: 'Commercial Water Sanitation & Plumbing',
    experience: {
      years: 6,
      primaryTrade: 'Plumbing & Water Sanitation',
      subTrades: ['CPVC Concealed Piping', 'Hydro-Pneumatic Pumps', 'Drain Jetting'],
      bio: 'Certified master plumber specializing in high-pressure water mains and bathroom renovation.',
    },
    skills: [
      { name: 'CPVC Piping', category: 'Plumbing', nsdcLevel: 'Level 3', isPrimary: true },
      { name: 'Pump Overhaul', category: 'Plumbing', nsdcLevel: 'Level 4', isPrimary: false },
      { name: 'Drain Jetting', category: 'Sanitation', nsdcLevel: 'Level 3', isPrimary: false },
    ],
    rates: { dailyFloorRate: 1150, hourlyRate: 400, currency: 'INR' },
    latitude: 18.5314,
    longitude: 73.8446,
    serviceArea: { radiusKm: 18, city: 'Pune' },
    location: {
      address: { street: 'B-12 Swapna Shilp, Shivajinagar', city: 'Pune', state: 'Maharashtra', pincode: '411005' },
      workingRadiusKm: 18,
      latitude: 18.5314,
      longitude: 73.8446,
      coordinates: [73.8446, 18.5314],
    },
    availability: {
      status: 'available',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hours: { start: '08:30', end: '19:00' },
    },
    verificationStatus: { status: 'verified', aadhaarVerified: true, nsdcCertified: true },
    rating: { average: 4.88, count: 61 },
    cooperative: 'Pune Shramik Vikas Sahakari',
    cooperativeId: '65f123456789012345678903',
    jobsCompleted: 310,
  },
  {
    id: '65f123456789012345678906',
    _id: '65f123456789012345678906',
    user: '65f123456789012345678906',
    name: 'Dattatray Pawar',
    phone: '+919820155667',
    trade: 'Modular Woodwork & Artisan Carpentry',
    experience: {
      years: 7,
      primaryTrade: 'Carpentry & Woodwork',
      subTrades: ['Modular Kitchen Fitting', 'Teakwood Restoration', 'Acoustic Paneling'],
      bio: 'Heritage and contemporary woodwork craftsman with extensive experience in commercial cabinetry.',
    },
    skills: [
      { name: 'Modular Kitchens', category: 'Carpentry', nsdcLevel: 'Level 4', isPrimary: true },
      { name: 'Furniture Restoration', category: 'Carpentry', nsdcLevel: 'Level 3', isPrimary: false },
      { name: 'Lock & Hinge Hardware', category: 'Carpentry', nsdcLevel: 'Level 3', isPrimary: false },
    ],
    rates: { dailyFloorRate: 1200, hourlyRate: 480, currency: 'INR' },
    latitude: 18.5167,
    longitude: 73.8415,
    serviceArea: { radiusKm: 15, city: 'Pune' },
    location: {
      address: { street: 'Prabhat Road, Deccan Gymkhana', city: 'Pune', state: 'Maharashtra', pincode: '411004' },
      workingRadiusKm: 15,
      latitude: 18.5167,
      longitude: 73.8415,
      coordinates: [73.8415, 18.5167],
    },
    availability: {
      status: 'available',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: { start: '09:00', end: '18:00' },
    },
    verificationStatus: { status: 'verified', aadhaarVerified: true, nsdcCertified: true },
    rating: { average: 4.91, count: 53 },
    cooperative: 'Pune Shramik Vikas Sahakari',
    cooperativeId: '65f123456789012345678903',
    jobsCompleted: 198,
  },
  {
    id: '65f123456789012345678907',
    _id: '65f123456789012345678907',
    user: '65f123456789012345678907',
    name: 'Ganesh Shingate',
    phone: '+919820188990',
    trade: 'Civil Construction & Masonry',
    experience: {
      years: 9,
      primaryTrade: 'Civil Construction & Masonry',
      subTrades: ['Brick Masonry', 'Tile Laying', 'Waterproofing Plaster'],
      bio: 'Master mason leading structural repair, tile finishing, and terrace waterproofing crews.',
    },
    skills: [
      { name: 'Precision Tile Laying', category: 'Masonry', nsdcLevel: 'Level 4', isPrimary: true },
      { name: 'Terrace Waterproofing', category: 'Masonry', nsdcLevel: 'Level 4', isPrimary: false },
      { name: 'Plastering & Leveling', category: 'Masonry', nsdcLevel: 'Level 3', isPrimary: false },
    ],
    rates: { dailyFloorRate: 1400, hourlyRate: 550, currency: 'INR' },
    latitude: 18.5018,
    longitude: 73.8636,
    serviceArea: { radiusKm: 20, city: 'Pune' },
    location: {
      address: { street: 'Near Swargate Bus Station', city: 'Pune', state: 'Maharashtra', pincode: '411042' },
      workingRadiusKm: 20,
      latitude: 18.5018,
      longitude: 73.8636,
      coordinates: [73.8636, 18.5018],
    },
    availability: {
      status: 'available',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hours: { start: '08:00', end: '17:30' },
    },
    verificationStatus: { status: 'verified', aadhaarVerified: true, nsdcCertified: true },
    rating: { average: 4.92, count: 95 },
    cooperative: 'Maharashtra Karigar Mahasangh',
    cooperativeId: '65f123456789012345678904',
    jobsCompleted: 520,
  },
  {
    id: '65f123456789012345678908',
    _id: '65f123456789012345678908',
    user: '65f123456789012345678908',
    name: 'Kavita Sonawane',
    phone: '+919820177889',
    trade: 'Professional Painting & Surface Coating',
    experience: {
      years: 5,
      primaryTrade: 'Professional Painting',
      subTrades: ['Airless Spraying', 'Texture Wall Finishing', 'Epoxy Floor Coating'],
      bio: 'Certified surface technician and master painter for interior textures and exterior weather-proofing.',
    },
    skills: [
      { name: 'Texture Wall Coating', category: 'Painting', nsdcLevel: 'Level 3', isPrimary: true },
      { name: 'Airless Spray Painting', category: 'Painting', nsdcLevel: 'Level 4', isPrimary: false },
    ],
    rates: { dailyFloorRate: 1100, hourlyRate: 380, currency: 'INR' },
    latitude: 18.5679,
    longitude: 73.9143,
    serviceArea: { radiusKm: 15, city: 'Pune' },
    location: {
      address: { street: 'Symbiosis Road, Viman Nagar', city: 'Pune', state: 'Maharashtra', pincode: '411014' },
      workingRadiusKm: 15,
      latitude: 18.5679,
      longitude: 73.9143,
      coordinates: [73.9143, 18.5679],
    },
    availability: {
      status: 'available',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hours: { start: '08:00', end: '18:00' },
    },
    verificationStatus: { status: 'verified', aadhaarVerified: true, nsdcCertified: true },
    rating: { average: 4.96, count: 47 },
    cooperative: 'Pune Shramik Vikas Sahakari',
    cooperativeId: '65f123456789012345678903',
    jobsCompleted: 142,
  },
  {
    id: '65f123456789012345678909',
    _id: '65f123456789012345678909',
    user: '65f123456789012345678909',
    name: 'Mahesh Shinde',
    phone: '+919820122334',
    trade: 'Electrical & Power Systems',
    experience: {
      years: 5,
      primaryTrade: 'Electrical & Power Systems',
      subTrades: ['Commercial Inverter Tech', 'Submeter Wiring'],
      bio: 'Appliance and 3-phase commercial wireman.',
    },
    skills: [
      { name: 'Commercial Wiring', category: 'Electrical', nsdcLevel: 'Level 3', isPrimary: true },
    ],
    rates: { dailyFloorRate: 1100, hourlyRate: 400, currency: 'INR' },
    latitude: 18.5089,
    longitude: 73.9259,
    serviceArea: { radiusKm: 12, city: 'Pune' },
    location: {
      address: { street: 'Magarpatta City, Hadapsar', city: 'Pune', state: 'Maharashtra', pincode: '411028' },
      workingRadiusKm: 12,
      latitude: 18.5089,
      longitude: 73.9259,
      coordinates: [73.9259, 18.5089],
    },
    availability: {
      status: 'busy', // Offline / currently on job for availability testing
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: { start: '08:00', end: '18:00' },
    },
    verificationStatus: { status: 'verified', aadhaarVerified: true, nsdcCertified: true },
    rating: { average: 4.79, count: 38 },
    cooperative: 'Pune Shramik Vikas Sahakari',
    cooperativeId: '65f123456789012345678903',
    jobsCompleted: 112,
  },
];

for (const worker of additionalSeedWorkers) {
  inMemoryWorkers.set(worker.id, worker);
}

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
    // Geolocation and Service Area
    const lat = Number(onboardingData.latitude) || Number(address.latitude) || 18.5204;
    const lng = Number(onboardingData.longitude) || Number(address.longitude) || 73.8567;
    const radius = Number(onboardingData.serviceArea?.radiusKm) || Number(workingRadiusKm) || 15;

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
      latitude: lat,
      longitude: lng,
      serviceArea: {
        radiusKm: radius,
        city: address.city || 'Pune',
        pincodes: onboardingData.serviceArea?.pincodes || (address.pincode ? [address.pincode] : []),
      },
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        latitude: lat,
        longitude: lng,
        address: {
          street: address.street || '',
          city: address.city || 'Pune',
          state: address.state || 'Maharashtra',
          pincode: address.pincode || '',
        },
        workingRadiusKm: radius,
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
    return BookingService.getBookings({
      userId,
      role: 'WORKER',
    });
  }
}
