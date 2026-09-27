import { Cooperative } from '../models/Cooperative.model.js';
import { Worker, WorkerProfile } from '../models/WorkerProfile.model.js';
import { User } from '../models/User.model.js';
import { Booking } from '../models/Booking.model.js';
import { BookingService } from './booking.service.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

// In-memory cooperative store for offline development and testing
export const inMemoryCooperatives = new Map();

// Initialize default cooperative society
const defaultCoopId = '65f123456789012345678903';
inMemoryCooperatives.set(defaultCoopId, {
  id: defaultCoopId,
  _id: defaultCoopId,
  userId: defaultCoopId,
  name: 'Pune Shramik Vikas Sahakari',
  registrationDetails: {
    registrationNumber: 'MH-PUN-COOP-2022-8812',
    state: 'Maharashtra',
    registeredYear: 2022,
    registrarApproved: true,
    authority: 'State Registrar of Cooperative Societies, Pune',
  },
  description: 'Democratic artisan guild supporting industrial wiremen, commercial plumbers, and masonry specialists with guaranteed minimum floor wages and direct DBT settlements.',
  serviceCategories: [
    'Electrical & Power Systems',
    'Plumbing & Water Sanitation',
    'Carpentry & Woodwork',
    'Masonry & Civil Works',
  ],
  latitude: 18.5204,
  longitude: 73.8436,
  serviceArea: {
    radiusKm: 25,
    district: 'Pune',
    pincodes: ['411001', '411004', '411038', '411052'],
  },
  location: {
    address: 'Shramik Bhavan, 3rd Floor, FC Road, Shivajinagar',
    district: 'Pune',
    state: 'Maharashtra',
    operationalPincodes: ['411001', '411004', '411038', '411052'],
    latitude: 18.5204,
    longitude: 73.8436,
    coordinates: [73.8436, 18.5204],
  },
  governance: {
    presidentName: 'Sanjay Tukaram Jadhav',
    secretaryName: 'Anjali Deshmukh',
    contactEmail: 'pune.coop@shramsetu.gov.in',
    contactPhone: '+91 98201 99999',
  },
  members: [
    {
      id: 'W-MH-4019',
      _id: 'W-MH-4019',
      name: 'Rajeshwar Shinde',
      phone: '+91 98201 44019',
      trade: 'Electrical & Power Systems',
      primaryTrade: 'Electrical & Power Systems',
      subTrades: ['Industrial Wiring', 'Solar Inverter Setup', 'Distribution Boards'],
      skills: ['Distribution Boards', 'Short Circuit Diagnostics', 'Solar Inverters', 'Appliance Load Balancing'],
      experienceYears: 8,
      dailyFloorRate: 1300,
      hourlyRate: 450,
      status: 'available',
      rating: 4.94,
      jobsCompleted: 462,
      isVerified: true,
      aadhaarVerified: true,
      nsdcCertified: true,
    },
    {
      id: 'W-MH-3312',
      _id: 'W-MH-3312',
      name: 'Santosh Waghmare',
      phone: '+91 98201 11223',
      trade: 'Plumbing & Water Sanitation',
      primaryTrade: 'Plumbing & Water Sanitation',
      subTrades: ['Pipeline Installation', 'Hydro-Jetting', 'Sanitary Fitting'],
      skills: ['Leakage Detection', 'PPR/CPVC Fitting', 'Motor Pump Overhaul', 'Drainage Sanitation'],
      experienceYears: 6,
      dailyFloorRate: 1150,
      hourlyRate: 400,
      status: 'available',
      rating: 4.88,
      jobsCompleted: 310,
      isVerified: true,
      aadhaarVerified: true,
      nsdcCertified: true,
    },
    {
      id: 'W-MH-2245',
      _id: 'W-MH-2245',
      name: 'Dattatray Pawar',
      phone: '+91 98201 55667',
      trade: 'Carpentry & Woodwork',
      primaryTrade: 'Carpentry & Woodwork',
      subTrades: ['Modular Furniture', 'Door & Lock Fitting', 'Wood Polishing'],
      skills: ['Modular Kitchens', 'Custom Woodwork', 'Precision Lathe & Joinery', 'Hardware Fitting'],
      experienceYears: 7,
      dailyFloorRate: 1200,
      hourlyRate: 420,
      status: 'available',
      rating: 4.91,
      jobsCompleted: 198,
      isVerified: true,
      aadhaarVerified: true,
      nsdcCertified: true,
    },
    {
      id: 'W-MH-7789',
      _id: 'W-MH-7789',
      name: 'Kavita Sonawane',
      phone: '+91 98201 77889',
      trade: 'Professional Painting & Surface Coating',
      primaryTrade: 'Professional Painting & Surface Coating',
      subTrades: ['Interior Emulsion', 'Waterproofing', 'Texture Stencil'],
      skills: ['Airless Spray Painting', 'Wall Putty Leveling', 'Epoxy Flooring', 'Damp-Proof Coating'],
      experienceYears: 5,
      dailyFloorRate: 1100,
      hourlyRate: 380,
      status: 'available',
      rating: 4.96,
      jobsCompleted: 142,
      isVerified: true,
      aadhaarVerified: true,
      nsdcCertified: true,
    },
    {
      id: 'W-MH-9901',
      _id: 'W-MH-9901',
      name: 'Sachin Jadhav',
      phone: '+91 98201 22334',
      trade: 'HVAC & Refrigeration Services',
      primaryTrade: 'HVAC & Refrigeration Services',
      subTrades: ['Inverter AC Servicing', 'Gas Charging', 'Chiller Maintenance'],
      skills: ['Compressor Repair', 'Vacuum Pump Evacuation', 'Ductless Mini-Split Fitting', 'Refrigerant Recovery'],
      experienceYears: 9,
      dailyFloorRate: 1350,
      hourlyRate: 500,
      status: 'available',
      rating: 4.93,
      jobsCompleted: 284,
      isVerified: true,
      aadhaarVerified: true,
      nsdcCertified: true,
    },
  ],
  verificationStatus: 'verified',
  welfareFund: {
    balance: 28000000,
    totalDisbursed: 4200000,
  },
  trustScore: 98.4,
});

// Seed second cooperative society in Kothrud
const secondCoopId = '65f123456789012345678904';
inMemoryCooperatives.set(secondCoopId, {
  id: secondCoopId,
  _id: secondCoopId,
  userId: secondCoopId,
  name: 'Maharashtra Karigar Mahasangh',
  registrationDetails: {
    registrationNumber: 'MH-PUN-COOP-2020-5519',
    state: 'Maharashtra',
    registeredYear: 2020,
    registrarApproved: true,
    authority: 'State Registrar of Cooperative Societies, Pune West',
  },
  description: 'Apex union for civil construction masons, heavy structural welders, and industrial coatings specialists.',
  serviceCategories: [
    'Civil Construction & Masonry',
    'Professional Painting & Surface Coating',
    'Structural Fabrication & Welding',
    'Electrical & Power Systems',
  ],
  latitude: 18.5074,
  longitude: 73.8077,
  serviceArea: {
    radiusKm: 22,
    district: 'Pune',
    pincodes: ['411038', '411029', '411041', '411058'],
  },
  location: {
    address: 'Artisan Hub, Kothrud Industrial Estate, Paud Road',
    district: 'Pune',
    state: 'Maharashtra',
    operationalPincodes: ['411038', '411029', '411041', '411058'],
    latitude: 18.5074,
    longitude: 73.8077,
    coordinates: [73.8077, 18.5074],
  },
  governance: {
    presidentName: 'Vinayak Rao Patil',
    secretaryName: 'Rameshwar Ghodke',
    contactEmail: 'karigar.mahasangh@shramsetu.gov.in',
    contactPhone: '+91 98202 88888',
  },
  members: [
    {
      id: 'W-MH-8890',
      _id: 'W-MH-8890',
      name: 'Ganesh Shingate',
      phone: '+91 98201 88990',
      trade: 'Civil Construction & Masonry',
      primaryTrade: 'Civil Construction & Masonry',
      subTrades: ['Brickwork', 'Plastering', 'Tile Laying', 'Structural Concrete'],
      skills: ['Leveling & Plumb', 'Waterproofing Compound Mixing', 'Granite & Vitrified Tiling', 'Scaffolding Safety'],
      experienceYears: 9,
      dailyFloorRate: 1400,
      hourlyRate: 550,
      status: 'available',
      rating: 4.92,
      jobsCompleted: 520,
      isVerified: true,
      aadhaarVerified: true,
      nsdcCertified: true,
    },
    {
      id: 'W-MH-6671',
      _id: 'W-MH-6671',
      name: 'Vijay Gaikwad',
      phone: '+91 98202 33445',
      trade: 'Structural Fabrication & Welding',
      primaryTrade: 'Structural Fabrication & Welding',
      subTrades: ['TIG/MIG Welding', 'Safety Grill Fabrication', 'Shed Framework'],
      skills: ['Arc Welding 6G', 'Plasma Torch Cutting', 'Load-Bearing Truss Fitting', 'Rust Prevention Primer'],
      experienceYears: 11,
      dailyFloorRate: 1450,
      hourlyRate: 520,
      status: 'available',
      rating: 4.95,
      jobsCompleted: 390,
      isVerified: true,
      aadhaarVerified: true,
      nsdcCertified: true,
    },
  ],
  verificationStatus: 'verified',
  welfareFund: {
    balance: 19500000,
    totalDisbursed: 3100000,
  },
  trustScore: 96.8,
});

export class CooperativeService {
  /**
   * Get Cooperative profile by User ID or Cooperative ID
   */
  static async getProfile(userId) {
    const cleanId = String(userId);

    if (mongoose.connection.readyState === 1) {
      let coop = await Cooperative.findOne({
        $or: [{ _id: cleanId }, { 'governance.contactEmail': cleanId }],
      });

      if (!coop) {
        // Return blank template
        return {
          id: cleanId,
          name: '',
          registrationDetails: { registrationNumber: '', state: 'Maharashtra', registeredYear: new Date().getFullYear(), authority: '' },
          description: '',
          serviceCategories: [],
          location: { address: '', district: 'Pune', state: 'Maharashtra', operationalPincodes: [] },
          governance: { presidentName: '', secretaryName: '', contactEmail: '', contactPhone: '' },
          verificationStatus: 'pending',
          members: [],
          isNewProfile: true,
        };
      }
      return coop;
    }

    // In-memory lookup
    for (const [, c] of inMemoryCooperatives) {
      if (String(c.id) === cleanId || String(c.userId) === cleanId || c.governance?.contactEmail === cleanId) {
        return c;
      }
    }

    // Default template for new cooperative registration in dev mode
    const template = {
      id: cleanId,
      _id: cleanId,
      userId: cleanId,
      name: 'New Cooperative Society',
      registrationDetails: { registrationNumber: '', state: 'Maharashtra', registeredYear: new Date().getFullYear(), authority: 'State Registrar' },
      description: '',
      serviceCategories: ['Electrical & Power Systems', 'Plumbing & Water Sanitation'],
      location: { address: '', district: 'Pune', state: 'Maharashtra', operationalPincodes: ['411001'] },
      governance: { presidentName: '', secretaryName: '', contactEmail: '', contactPhone: '' },
      verificationStatus: 'pending',
      members: [],
      isNewProfile: true,
    };
    inMemoryCooperatives.set(cleanId, template);
    return template;
  }

  /**
   * Save or update Cooperative onboarding data
   */
  static async saveOnboarding(userId, onboardingData) {
    const cleanId = String(userId);
    const {
      name,
      registrationNumber,
      state = 'Maharashtra',
      registeredYear = new Date().getFullYear(),
      authority = 'State Registrar of Cooperative Societies',
      description = '',
      serviceCategories = [],
      address = '',
      district = 'Pune',
      operationalPincodes = [],
      presidentName = '',
      secretaryName = '',
      contactEmail = '',
      contactPhone = '',
      certificateUrl = null,
    } = onboardingData;

    // Geolocation and Service Area
    const lat = Number(onboardingData.latitude) || 18.5204;
    const lng = Number(onboardingData.longitude) || 73.8436;
    const radius = Number(onboardingData.serviceArea?.radiusKm) || Number(onboardingData.coverageRadiusKm) || 25;
    const pincodesList = Array.isArray(operationalPincodes)
      ? operationalPincodes
      : String(operationalPincodes || '').split(',').map((p) => p.trim()).filter(Boolean);

    const payload = {
      name: name || 'Cooperative Guild',
      registrationDetails: {
        registrationNumber: registrationNumber || `REG-${Date.now()}`,
        state,
        registeredYear: Number(registeredYear) || new Date().getFullYear(),
        authority,
        certificateUrl,
      },
      description,
      serviceCategories: Array.isArray(serviceCategories) ? serviceCategories : [serviceCategories],
      latitude: lat,
      longitude: lng,
      serviceArea: {
        radiusKm: radius,
        district,
        pincodes: pincodesList,
      },
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        latitude: lat,
        longitude: lng,
        address,
        district,
        state,
        operationalPincodes: pincodesList,
      },
      governance: {
        presidentName,
        secretaryName,
        contactEmail,
        contactPhone,
      },
      verificationStatus: 'pending',
    };

    if (mongoose.connection.readyState === 1) {
      const updated = await Cooperative.findOneAndUpdate(
        { $or: [{ name: payload.name }, { 'registrationDetails.registrationNumber': payload.registrationDetails.registrationNumber }] },
        { $set: payload },
        { new: true, upsert: true, runValidators: true }
      );

      // Link cooperative to user
      await User.findByIdAndUpdate(cleanId, { cooperativeId: updated._id });
      return updated;
    }

    // In-memory persistence
    const existing = inMemoryCooperatives.get(cleanId) || {};
    const updatedRecord = {
      ...existing,
      ...payload,
      id: cleanId,
      _id: cleanId,
      userId: cleanId,
      members: existing.members || [],
      verificationStatus: 'pending',
      updatedAt: new Date().toISOString(),
      isNewProfile: false,
    };
    inMemoryCooperatives.set(cleanId, updatedRecord);
    return updatedRecord;
  }

  /**
   * Get Cooperative verification checklist & status
   */
  static async getVerificationStatus(userId) {
    const coop = await this.getProfile(userId);
    const status = coop.verificationStatus || 'pending';

    const checklist = [
      { id: 'org', title: 'State Registration & Number', complete: Boolean(coop.registrationDetails?.registrationNumber) },
      { id: 'services', title: 'Supported Trade Categories', complete: Boolean(coop.serviceCategories?.length > 0) },
      { id: 'location', title: 'Operational Jurisdiction & Pincodes', complete: Boolean(coop.location?.district) },
      { id: 'governance', title: 'Elected Office Bearers Contact Details', complete: Boolean(coop.governance?.presidentName) },
      { id: 'members', title: 'Member Artisan Roster', complete: Boolean(coop.members?.length > 0) },
      { id: 'registrar', title: 'State Registrar Audit Clearance', complete: status === 'verified' },
    ];

    const completedCount = checklist.filter((c) => c.complete).length;

    return {
      status,
      societyName: coop.name,
      registrationNumber: coop.registrationDetails?.registrationNumber,
      checklist,
      completionPercentage: Math.round((completedCount / checklist.length) * 100),
      trustScore: coop.trustScore || 95.0,
      remarks: coop.remarks || null,
    };
  }

  /**
   * Get list of all registered cooperatives (public / authenticated)
   */
  static async getCooperativesList() {
    if (mongoose.connection.readyState === 1) {
      return Cooperative.find({}, 'name registrationDetails location serviceCategories verificationStatus');
    }

    const list = [];
    for (const [, c] of inMemoryCooperatives) {
      list.push({
        id: c.id,
        _id: c.id,
        name: c.name,
        state: c.registrationDetails?.state || c.location?.state,
        district: c.location?.district,
        serviceCategories: c.serviceCategories,
        verificationStatus: c.verificationStatus,
        memberCount: c.members?.length || 0,
      });
    }
    return list;
  }

  /**
   * Get members of cooperative
   */
  static async getMembers(cooperativeId) {
    const cleanId = String(cooperativeId);
    if (mongoose.connection.readyState === 1) {
      let coop = await Cooperative.findOne({
        $or: [{ _id: cleanId }, { 'governance.contactEmail': cleanId }],
      });
      const coopId = coop?._id || cleanId;

      // Query workers enrolled in this cooperative
      const workers = await Worker.find({ cooperative: coopId }).populate('user', 'name phone email profileImage isActive');
      return workers.map((w) => {
        const coordinates = w.liveLocation?.coordinates?.length === 2
          ? w.liveLocation.coordinates
          : Number.isFinite(w.address?.longitude) && Number.isFinite(w.address?.latitude)
            ? [w.address.longitude, w.address.latitude]
            : null;
        return {
          id: String(w._id),
          _id: String(w._id),
          userId: w.user?._id || w.user,
          name: w.user?.name || w.name || 'Artisan',
          phone: w.user?.phone || w.phone || '',
          email: w.user?.email || w.email || '',
          profileImage: w.user?.profileImage || w.profileImage || null,
          trade: w.experience?.primaryTrade || w.primaryTrade || 'General Artisan',
          profession: w.profession || w.experience?.primaryTrade || w.primaryTrade || '',
          primaryTrade: w.experience?.primaryTrade || w.primaryTrade || 'General Artisan',
          subTrades: w.experience?.subTrades || [],
          skills: (w.skills || []).map((s) => s.name || s),
          experienceYears: w.experience?.years || 0,
          dailyFloorRate: w.rates?.dailyFloorRate ?? null,
          hourlyRate: w.rates?.hourlyRate ?? null,
          status: w.availability?.status || 'available',
          availability: w.availability,
          coordinates,
          address: w.address || w.location?.address || null,
          lastUpdated: w.liveLocation?.updatedAt || w.updatedAt || null,
          isActive: w.user?.isActive !== false,
          rating: w.rating?.average ?? null,
          ratingCount: w.rating?.count ?? 0,
          jobsCompleted: w.jobsCompleted ?? 0,
          isVerified: w.verificationStatus?.aadhaarVerified || false,
          aadhaarVerified: w.verificationStatus?.aadhaarVerified || false,
          nsdcCertified: w.verificationStatus?.nsdcCertified || false,
        };
      });
    }

    const { inMemoryWorkers } = await import('./worker.service.js');
    return [...inMemoryWorkers.values()]
      .filter((worker) => {
        const workerCooperativeId = String(
          worker.cooperative?._id || worker.cooperative?.id || worker.cooperativeId || worker.cooperative || '',
        );
        return workerCooperativeId === cleanId;
      })
      .map((worker) => ({
        id: String(worker._id || worker.id),
        _id: String(worker._id || worker.id),
        userId: worker.userId || worker.user?._id || worker.user || null,
        name: worker.name || 'Artisan',
        phone: worker.phone || '',
        email: worker.email || '',
        profileImage: worker.profileImage || null,
        trade: worker.experience?.primaryTrade || worker.trade || '',
        profession: worker.profession || worker.experience?.primaryTrade || worker.trade || '',
        primaryTrade: worker.experience?.primaryTrade || worker.trade || '',
        subTrades: worker.experience?.subTrades || [],
        skills: (worker.skills || []).map((skill) => skill.name || skill),
        experienceYears: worker.experience?.years || 0,
        dailyFloorRate: worker.rates?.dailyFloorRate ?? null,
        hourlyRate: worker.rates?.hourlyRate ?? null,
        status: worker.availability?.status || 'offline',
        availability: worker.availability || null,
        coordinates: worker.liveLocation?.coordinates || (
          Number.isFinite(worker.address?.longitude) && Number.isFinite(worker.address?.latitude)
            ? [worker.address.longitude, worker.address.latitude]
            : Number.isFinite(worker.longitude) && Number.isFinite(worker.latitude)
              ? [worker.longitude, worker.latitude]
              : null
        ),
        address: worker.address || worker.location?.address || null,
        lastUpdated: worker.liveLocation?.updatedAt || worker.updatedAt || null,
        isActive: true,
        rating: worker.rating?.average ?? null,
        ratingCount: worker.rating?.count ?? 0,
        jobsCompleted: worker.jobsCompleted ?? 0,
        isVerified: Boolean(worker.verificationStatus?.aadhaarVerified),
        aadhaarVerified: Boolean(worker.verificationStatus?.aadhaarVerified),
        nsdcCertified: Boolean(worker.verificationStatus?.nsdcCertified),
      }));
  }

  /**
   * Add a new member to the cooperative
   */
  static async addMember(cooperativeId, memberData) {
    const cleanId = String(cooperativeId);
    const newMember = {
      id: `W-MBR-${Date.now().toString().slice(-4)}`,
      _id: `W-MBR-${Date.now().toString().slice(-4)}`,
      name: memberData.name || 'New Artisan',
      phone: memberData.phone || '+91 98000 00000',
      trade: memberData.trade || 'General Artisan',
      dailyFloorRate: Number(memberData.dailyFloorRate) || 1000,
      hourlyRate: Number(memberData.hourlyRate) || 300,
      status: 'available',
      rating: 5.0,
      jobsCompleted: 0,
      isVerified: false,
      joinedDate: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      const coop = await Cooperative.findByIdAndUpdate(
        cleanId,
        { $push: { members: newMember.id } },
        { new: true }
      );
      return newMember;
    }

    const coop = await this.getProfile(cleanId);
    if (!coop.members) coop.members = [];
    coop.members.unshift(newMember);
    inMemoryCooperatives.set(cleanId, coop);
    return newMember;
  }

  /**
   * Remove a member from the cooperative
   */
  static async removeMember(cooperativeId, memberId) {
    const cleanId = String(cooperativeId);

    if (mongoose.connection.readyState === 1) {
      await Cooperative.findByIdAndUpdate(cleanId, {
        $pull: { members: memberId },
      });
      return { success: true, memberId };
    }

    const coop = await this.getProfile(cleanId);
    if (coop.members) {
      coop.members = coop.members.filter((m) => String(m.id) !== String(memberId) && String(m._id) !== String(memberId));
      inMemoryCooperatives.set(cleanId, coop);
    }
    return { success: true, memberId };
  }

  /**
   * Get incoming booking requests
   */
  static async getIncomingRequests(cooperativeId) {
    return BookingService.getBookings({
      userId: cooperativeId,
      cooperativeId,
      role: 'COOPERATIVE',
    });
  }

  /**
   * Assign worker to booking
   */
  static async assignWorker(bookingId, workerId, cooperativeUserId = null, role = 'COOPERATIVE') {
    return BookingService.assignWorker(bookingId, workerId, cooperativeUserId || defaultCoopId, role);
  }
}
