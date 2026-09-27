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
    };

    if (mongoose.connection.readyState === 1) {
      const profile = await Worker.findOneAndUpdate(
        { user: cleanId },
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
   * Update editable worker profile fields: bio, phone, workingRadiusKm
   * Called by PATCH /api/v1/workers/profile
   */
  static async updateProfile(userId, { bio, phone, workingRadiusKm }) {
    const cleanId = String(userId);

    if (mongoose.connection.readyState === 1) {
      const updateFields = {};

      if (bio !== undefined) updateFields.bio = String(bio).trim().slice(0, 2000);
      if (phone !== undefined) updateFields.phone = String(phone).trim();
      if (workingRadiusKm !== undefined) {
        const r = parseInt(workingRadiusKm, 10);
        if (isNaN(r) || r < 1 || r > 100) {
          throw new AppError('Working radius must be between 1 and 100 km', 400);
        }
        updateFields['location.workingRadiusKm'] = r;
      }

      const profile = await Worker.findOneAndUpdate(
        { $or: [{ user: cleanId }, { userId: cleanId }] },
        { $set: updateFields },
        { new: true }
      ).populate('user', 'name email');

      if (!profile) throw new AppError('Worker profile not found', 404);
      return profile;
    }

    // In-memory fallback (dev/test without MongoDB)
    const worker = await this.getProfile(cleanId);
    if (bio !== undefined) worker.bio = String(bio).trim().slice(0, 2000);
    if (phone !== undefined) worker.phone = String(phone).trim();
    if (workingRadiusKm !== undefined) {
      const r = parseInt(workingRadiusKm, 10);
      if (isNaN(r) || r < 1 || r > 100) {
        throw new AppError('Working radius must be between 1 and 100 km', 400);
      }
      if (!worker.location) worker.location = {};
      worker.location.workingRadiusKm = r;
    }
    inMemoryWorkers.set(cleanId, worker);
    return worker;
  }


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
   * Validate document file upload constraints (PDF, JPG, JPEG, PNG <= 5MB)
   */
  static validateDocumentUpload({ mimetype, size, originalname }) {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (mimetype && !allowedMimeTypes.includes(mimetype.toLowerCase())) {
      throw new AppError('Invalid document format. Only PDF, JPG, JPEG, and PNG files are accepted.', 400);
    }

    if (originalname) {
      const ext = originalname.substring(originalname.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        throw new AppError('Invalid file extension. Only .pdf, .jpg, .jpeg, and .png are allowed.', 400);
      }
    }

    if (size && size > maxSize) {
      throw new AppError('File size exceeds the 5MB limit. Please upload a smaller file.', 400);
    }

    return true;
  }

  /**
   * Get registration status and progress for sequential onboarding
   */
  static async getRegistrationStatus(userId) {
    const cleanId = String(userId);
    let worker;

    if (mongoose.connection.readyState === 1) {
      worker = await Worker.findOne({ $or: [{ user: cleanId }, { userId: cleanId }] }).populate('cooperative');
    }

    if (!worker) {
      worker = inMemoryWorkers.get(cleanId);
    }

    if (!worker) {
      return {
        registrationStatus: 'DRAFT',
        currentStep: 1,
        maxCompletedStep: 0,
        isLocked: false,
        phoneVerified: false,
        eshramProvided: false,
        cooperative: null,
        profession: null,
        skills: [],
        address: {},
        documents: {},
        // Frontend reads registrationProgress.completedSteps
        registrationProgress: {
          completedSteps: [],
          currentStep: 1,
          maxCompletedStep: 0,
        },
        worker: null,
      };
    }

    const regStatus = worker.registrationStatus || 'DRAFT';
    const isLocked = regStatus === 'PENDING_APPROVAL' || regStatus === 'APPROVED';
    const maxCompletedStep = worker.registrationProgress?.maxCompletedStep || 0;
    const currentStep = worker.registrationProgress?.currentStep || (maxCompletedStep + 1);

    // Build completedSteps array from maxCompletedStep integer
    // e.g. maxCompletedStep=3 means steps [1,2,3] are all completed
    const completedSteps = maxCompletedStep > 0
      ? Array.from({ length: maxCompletedStep }, (_, i) => i + 1)
      : [];

    const workerData = {
      name: worker.name || '',
      email: worker.email || '',
      phone: worker.phone || '',
      phoneVerified: Boolean(worker.phoneVerified),
      profileImage: worker.profileImage || '',
      bio: worker.bio || worker.experience?.bio || '',
      cooperativeId: worker.cooperativeId || (worker.cooperative?._id ? String(worker.cooperative._id) : null) || null,
      profession: worker.profession || worker.experience?.primaryTrade || null,
      customProfession: worker.customProfession || null,
      address: worker.address || worker.location?.address || {},
      skills: worker.skills || [],
      documents: worker.documents || {},
    };

    return {
      workerId: worker.id || worker._id,
      userId: worker.user || worker.userId || cleanId,
      name: worker.name || '',
      email: worker.email || '',
      phone: worker.phone || '',
      registrationStatus: regStatus,
      currentStep,
      maxCompletedStep,
      isLocked,
      phoneVerified: Boolean(worker.phoneVerified),
      eshramProvided: Boolean(worker.eshramProvided || worker.documents?.eshramCard?.url),
      cooperative: worker.cooperative || worker.cooperativeId || null,
      profession: worker.profession || worker.experience?.primaryTrade || null,
      customProfession: worker.customProfession || null,
      skills: worker.skills || [],
      address: worker.address || worker.location?.address || {},
      documents: worker.documents || {},
      rejectionReason: worker.rejectionReason || worker.verificationStatus?.rejectionReason || null,
      // registrationProgress with completedSteps array — required by frontend wizard
      registrationProgress: {
        completedSteps,
        currentStep,
        maxCompletedStep,
        phoneVerified: Boolean(worker.phoneVerified),
      },
      // worker sub-object for frontend formData hydration
      worker: workerData,
    };
  }


  /**
   * Sequential step saving with validation & lock prevention
   */
  static async saveStep(userId, stepNumber, stepData = {}) {
    const cleanId = String(userId);
    const step = parseInt(stepNumber, 10);

    if (isNaN(step) || step < 1 || step > 8) {
      throw new AppError('Invalid step number. Must be between 1 and 8.', 400);
    }

    // Retrieve existing worker
    let worker;
    if (mongoose.connection.readyState === 1) {
      worker = await Worker.findOne({ $or: [{ user: cleanId }, { userId: cleanId }] });
    } else {
      worker = inMemoryWorkers.get(cleanId);
    }

    if (!worker) {
      if (step === 1) {
        // Auto-initialize worker record for new registrations
        if (mongoose.connection.readyState === 1) {
          try {
            worker = await Worker.create({
              user: cleanId,
              experience: { years: 0, primaryTrade: 'General', subTrades: [] },
              skills: [],
              rates: { dailyFloorRate: 800, hourlyRate: 250 },
              registrationStatus: 'DRAFT',
              registrationProgress: { currentStep: 1, maxCompletedStep: 0 },
            });
          } catch {
            worker = null;
          }
        }

        if (!worker) {
          const template = {
            id: cleanId,
            _id: cleanId,
            user: cleanId,
            userId: cleanId,
            registrationStatus: 'DRAFT',
            registrationProgress: { currentStep: 1, maxCompletedStep: 0 },
            skills: [],
            documents: {},
            address: {},
          };
          inMemoryWorkers.set(cleanId, template);
          worker = template;
        }
      } else {
        throw new AppError('Worker record not found for this account. Please complete Step 1 first.', 404);
      }
    }

    // Check if registration is locked (already submitted)
    const currentStatus = worker.registrationStatus || 'DRAFT';
    if (currentStatus === 'PENDING_APPROVAL' || currentStatus === 'APPROVED') {
      throw new AppError('Registration is locked and currently under review or already approved. No further modifications are allowed.', 403);
    }

    // Step jumping prevention (sequential enforcement):
    const maxCompleted = worker.registrationProgress?.maxCompletedStep || 0;
    if (step > maxCompleted + 1) {
      throw new AppError(`Cannot skip to step ${step}. Please complete step ${maxCompleted + 1} first.`, 400);
    }

    const updateFields = {};

    // Step-specific validations & payload assembly — matches 8-step frontend wizard
    if (step === 1) {
      // Step 1: Basic Info — name, phone, email
      const { name, phone, email } = stepData;
      if (!name || !String(name).trim()) throw new AppError('Full name is required', 400);
      if (!email || !String(email).trim()) throw new AppError('Email address is required', 400);
      if (!phone || !String(phone).trim()) throw new AppError('Phone number is required', 400);
      updateFields.name = String(name).trim();
      updateFields.email = String(email).trim();
      updateFields.phone = String(phone).trim();

    } else if (step === 2) {
      // Step 2: OTP Verify — phoneVerified flag
      if (!stepData.phoneVerified) {
        throw new AppError('Phone number must be verified with OTP before proceeding.', 400);
      }
      updateFields.phoneVerified = true;
      if (stepData.phone) updateFields.phone = String(stepData.phone).trim();

    } else if (step === 3) {
      // Step 3: Profile — bio, profileImage, cooperativeId (optional)
      updateFields.bio = String(stepData.bio || '').trim();
      updateFields.profileImage = String(stepData.profileImage || '').trim();
      updateFields.cooperativeId = stepData.cooperativeId && String(stepData.cooperativeId).trim()
        ? String(stepData.cooperativeId).trim()
        : null;
      updateFields.cooperative = updateFields.cooperativeId;

    } else if (step === 4) {
      // Step 4: Address (pincode first)
      const addr = stepData.address || stepData;
      const pincode = String(addr.pincode || '').trim();
      if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
        throw new AppError('A valid 6-digit Indian PIN code is required', 400);
      }
      if (!addr.district || !addr.state) {
        throw new AppError('District and state are required. Use pincode autofill or location detect.', 400);
      }
      const line1 = String(addr.line1 || addr.addressLine1 || addr.addressLine || '').trim();
      if (!line1) {
        throw new AppError('Address Line 1 is required', 400);
      }
      const line2 = String(addr.line2 || addr.addressLine2 || '').trim();

      const addrObj = {
        line1,
        addressLine1: line1,
        line2,
        addressLine2: line2,
        pincode,
        district: String(addr.district).trim(),
        state: String(addr.state).trim(),
        city: String(addr.city || addr.district).trim(),
        latitude: addr.latitude ? parseFloat(addr.latitude) : (worker.latitude || 18.5204),
        longitude: addr.longitude ? parseFloat(addr.longitude) : (worker.longitude || 73.8567),
      };
      updateFields.address = addrObj;
      updateFields['location.address'] = {
        street: addrObj.line1,
        city: addrObj.city,
        state: addrObj.state,
        pincode: addrObj.pincode,
      };
      if (addrObj.latitude && addrObj.longitude) {
        updateFields.latitude = addrObj.latitude;
        updateFields.longitude = addrObj.longitude;
        updateFields['location.latitude'] = addrObj.latitude;
        updateFields['location.longitude'] = addrObj.longitude;
        updateFields['location.coordinates'] = [addrObj.longitude, addrObj.latitude];
      }

    } else if (step === 5) {
      // Step 5: Profession
      const { profession, customProfession } = stepData;
      if (!profession) throw new AppError('Profession is required', 400);
      updateFields.profession = String(profession).trim();
      if (customProfession) {
        updateFields.customProfession = String(customProfession).trim();
        updateFields['experience.primaryTrade'] = String(customProfession).trim();
      } else {
        updateFields.customProfession = null;
        updateFields['experience.primaryTrade'] = String(profession).trim();
      }

    } else if (step === 6) {
      // Step 6: Skills with experience & service radius
      const { skills } = stepData;
      if (!Array.isArray(skills) || skills.length === 0) {
        throw new AppError('Please select or add at least one skill', 400);
      }
      const formattedSkills = skills.map((s) => {
        const name = String(s.skillName || s.name || '').trim();
        if (!name) throw new AppError('Each skill must have a valid name', 400);
        const exp = Math.min(Math.max(parseInt(s.experienceYears ?? 1, 10) || 0, 0), 50);
        const rad = Math.min(Math.max(parseInt(s.serviceRadiusKm ?? 15, 10) || 1, 1), 100);
        return {
          name,
          skillName: name,
          category: s.category || worker.profession || 'Artisan Trade',
          experienceYears: exp,
          serviceRadiusKm: rad,
          isPrimary: Boolean(s.isPrimary),
        };
      });
      updateFields.skills = formattedSkills;

    } else if (step === 7) {
      // Step 7: Documents — Aadhaar, Address Proof, e-Shram (mandatory)
      // Police verification is permanently removed
      if (stepData.policeVerification || stepData.policeVerificationCertificate) {
        throw new AppError('Police verification has been removed from worker registration and cannot be submitted.', 400);
      }
      const { aadhaar, addressProof, eshramCard, documents } = stepData;
      // Support both flat and nested { documents: { aadhaar, addressProof, eshramCard } }
      const aadhaarDoc = aadhaar || documents?.aadhaar;
      const addressProofDoc = addressProof || documents?.addressProof;
      const eshramDoc = eshramCard || documents?.eshramCard;

      const currentDocs = worker.documents || {};
      const newDocs = {
        aadhaar: {
          url: aadhaarDoc?.url || currentDocs.aadhaar?.url || null,
          name: aadhaarDoc?.name || currentDocs.aadhaar?.name || 'Aadhaar Card.pdf',
          uploadedAt: aadhaarDoc?.url ? new Date() : currentDocs.aadhaar?.uploadedAt || null,
        },
        addressProof: {
          docType: addressProofDoc?.docType || currentDocs.addressProof?.docType || 'Electricity Bill',
          url: addressProofDoc?.url || currentDocs.addressProof?.url || null,
          name: addressProofDoc?.name || currentDocs.addressProof?.name || 'Address Proof.pdf',
          uploadedAt: addressProofDoc?.url ? new Date() : currentDocs.addressProof?.uploadedAt || null,
        },
        eshramCard: {
          url: eshramDoc?.url || currentDocs.eshramCard?.url || null,
          name: eshramDoc?.name || currentDocs.eshramCard?.name || 'e-Shram Card.pdf',
          uploadedAt: eshramDoc?.url ? new Date() : currentDocs.eshramCard?.uploadedAt || null,
        },
      };
      for (const [kind, input] of Object.entries({ aadhaar: aadhaarDoc, addressProof: addressProofDoc, eshramCard: eshramDoc })) {
        const value = input?.expiresAt === undefined ? currentDocs[kind]?.expiresAt : input.expiresAt;
        const expiry = value ? new Date(value) : null;
        if (expiry && !Number.isFinite(expiry.getTime())) throw new AppError('Invalid document expiry date', 400);
        newDocs[kind].expiresAt = expiry;
      }
      updateFields.documents = newDocs;
      if (newDocs.eshramCard.url) updateFields.eshramProvided = true;

    } else if (step === 8) {
      // Step 8: Review — no data changes, just marks review as complete
      // Actual submission is done via submitRegistration endpoint
    }

    // Advance maxCompletedStep (never go backwards)
    const newMaxCompleted = Math.max(maxCompleted, step);
    const nextStep = Math.min(step + 1, 8);

    updateFields['registrationProgress.maxCompletedStep'] = newMaxCompleted;
    updateFields['registrationProgress.currentStep'] = nextStep;

    if (mongoose.connection.readyState === 1) {
      await Worker.findOneAndUpdate(
        { $or: [{ user: cleanId }, { userId: cleanId }] },
        { $set: updateFields },
        { new: true }
      );
      return this.getRegistrationStatus(cleanId);
    }

    // In-memory update
    const updated = {
      ...worker,
      ...updateFields,
      registrationProgress: {
        ...(worker.registrationProgress || {}),
        maxCompletedStep: newMaxCompleted,
        currentStep: nextStep,
      },
      documents: updateFields.documents || worker.documents || {},
      address: updateFields.address || worker.address || {},
      skills: updateFields.skills || worker.skills || [],
    };
    inMemoryWorkers.set(cleanId, updated);
    return this.getRegistrationStatus(cleanId);
  }


  /**
   * Final submission of worker registration
   */
  static async submitRegistration(userId) {
    const cleanId = String(userId);
    let worker;

    if (mongoose.connection.readyState === 1) {
      worker = await Worker.findOne({ $or: [{ user: cleanId }, { userId: cleanId }] });
    } else {
      worker = inMemoryWorkers.get(cleanId);
    }

    if (!worker) {
      throw new AppError('Worker record not found for this account', 404);
    }

    // Lock check: prevent duplicate submissions
    if (worker.registrationStatus === 'PENDING_APPROVAL') {
      throw new AppError('Registration has already been submitted and is currently awaiting admin approval.', 400);
    }
    if (worker.registrationStatus === 'APPROVED') {
      throw new AppError('Registration has already been approved.', 400);
    }

    // e-Shram card is mandatory!
    const eshramUrl = worker.documents?.eshramCard?.url;
    if (!eshramUrl && !worker.eshramProvided) {
      throw new AppError(
        'e-Shram card is mandatory for worker registration. If you do not have one, please register at https://eshram.gov.in/ before completing submission.',
        400
      );
    }

    // Aadhaar card is mandatory
    const aadhaarUrl = worker.documents?.aadhaar?.url;
    if (!aadhaarUrl) {
      throw new AppError('Aadhaar Card document upload is mandatory for identity verification.', 400);
    }

    // Address proof is mandatory
    const addressProofUrl = worker.documents?.addressProof?.url;
    if (!addressProofUrl) {
      throw new AppError('Address proof document upload is mandatory.', 400);
    }

    // Skills check
    if (!worker.skills || worker.skills.length === 0) {
      throw new AppError('At least one trade skill must be added before submitting registration.', 400);
    }

    const updatePayload = {
      registrationStatus: 'PENDING_APPROVAL',
      'registrationProgress.isLocked': true,
      'verificationStatus.status': 'pending',
      'verificationStatus.submittedAt': new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      await Worker.findOneAndUpdate(
        { $or: [{ user: cleanId }, { userId: cleanId }] },
        { $set: updatePayload }
      );
    } else {
      inMemoryWorkers.set(cleanId, {
        ...worker,
        registrationStatus: 'PENDING_APPROVAL',
        registrationProgress: {
          ...(worker.registrationProgress || {}),
          isLocked: true,
        },
        verificationStatus: {
          ...(worker.verificationStatus || {}),
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      });
    }

    return {
      success: true,
      registrationStatus: 'PENDING_APPROVAL',
      message: 'Registration submitted successfully. Your profile is now under state administrator verification.',
    };
  }

  /**
   * Get verification status with checklist (Coop is optional, Police removed, e-Shram verified)
   */
  static async getVerificationStatus(userId) {
    const profile = await this.getProfile(userId);
    const ver = profile.verificationStatus || { status: 'pending', documents: [] };

    const hasEshram = Boolean(profile.eshramProvided || profile.documents?.eshramCard?.url);
    const hasAadhaar = Boolean(ver.aadhaarVerified || profile.documents?.aadhaar?.url);

    const checklist = [
      { id: 'profile', title: 'Professional Profile Details', complete: Boolean(profile.profession || profile.experience?.primaryTrade) },
      { id: 'skills', title: 'Technical Skill Roster', complete: Boolean(profile.skills?.length > 0) },
      { id: 'location', title: 'Operational Working Area & Pincode', complete: Boolean(profile.address?.pincode || profile.location?.address?.city) },
      { id: 'documents', title: 'KYC & Trade Identity Uploads', complete: Boolean(hasAadhaar) },
      { id: 'eshram', title: 'Mandatory e-Shram Verification', complete: hasEshram },
      { id: 'admin', title: 'State Registry Review', complete: ver.status === 'verified' || profile.registrationStatus === 'APPROVED' },
    ];

    const completedCount = checklist.filter((c) => c.complete).length;

    return {
      status: ver.status || 'pending',
      registrationStatus: profile.registrationStatus || (ver.status === 'verified' ? 'APPROVED' : 'PENDING_APPROVAL'),
      aadhaarVerified: hasAadhaar,
      eshramProvided: hasEshram,
      nsdcCertified: Boolean(ver.nsdcCertified),
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
