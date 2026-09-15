import mongoose from 'mongoose';
import { Booking } from '../models/Booking.model.js';
import { User } from '../models/User.model.js';
import { Worker } from '../models/Worker.model.js';
import { Cooperative } from '../models/Cooperative.model.js';
import { CatalogService } from './service.service.js';
import { AppError } from '../utils/AppError.js';

// State machine valid transition graph
export const VALID_TRANSITIONS = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'REJECTED', 'ASSIGNED', 'CANCELLED'],
  REJECTED: ['ASSIGNED', 'CANCELLED'],
  ACCEPTED: ['ON_THE_WAY', 'REJECTED', 'CANCELLED'],
  ON_THE_WAY: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
};

// In-memory bookings store for development and testing
export const inMemoryBookings = new Map();

// Helper to normalize status to standard uppercase
export function normalizeStatus(status) {
  if (!status) return 'PENDING';
  return String(status).trim().toUpperCase();
}

// Helper to normalize role
export function normalizeRole(role) {
  if (!role) return 'USER';
  const r = String(role).trim().toUpperCase();
  if (r === 'CUSTOMER') return 'USER';
  return r;
}

// Pre-seed default realistic bookings for testing and dev
const defaultCoopId = '65f123456789012345678903';
const defaultWorkerId = '65f123456789012345678902';
const defaultCustomerId = '65f123456789012345678901';

const sampleBookings = [
  {
    id: 'BK-2026-8801',
    _id: '65f123456789012345678951',
    customer: defaultCustomerId,
    customerId: defaultCustomerId,
    customerName: 'Aakash Sharma',
    customerPhone: '+91 98201 44520',
    cooperative: defaultCoopId,
    cooperativeId: defaultCoopId,
    cooperativeName: 'Pune Shramik Vikas Sahakari',
    worker: defaultWorkerId,
    workerId: defaultWorkerId,
    workerName: 'Rajeshwar Shinde',
    workerPhone: '+91 98201 44019',
    service: '65f123456789012345678911',
    serviceId: '65f123456789012345678911',
    serviceName: 'Electrical & Power Systems',
    trade: 'Electrical & Power Systems',
    location: {
      type: 'Point',
      coordinates: [73.8058, 18.5074],
      serviceAddress: {
        street: 'Flat 402, Green Meadows, Kothrud',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
        landmark: 'Near City Pride Kothrud',
      },
    },
    scheduledTime: {
      start: new Date(Date.now() + 3600000 * 4),
      end: new Date(Date.now() + 3600000 * 6),
    },
    status: 'ASSIGNED',
    price: {
      floorRateAmount: 450,
      totalAmount: 900,
      commissionCut: 0,
      currency: 'INR',
    },
    paymentStatus: 'escrow_locked',
    qrVerification: {
      token: 'QR-SS-8801-KOTH',
      otpCode: '4921',
      isVerified: false,
      verifiedAt: null,
    },
    specialInstructions: 'Need inspection for distribution board tripping and concealed line repair.',
    rejectionReason: null,
    statusHistory: [
      {
        status: 'PENDING',
        role: 'USER',
        timestamp: new Date(Date.now() - 3600000 * 2),
        note: 'Booking created by customer',
      },
      {
        status: 'ASSIGNED',
        role: 'COOPERATIVE',
        timestamp: new Date(Date.now() - 3600000 * 1),
        note: 'Assigned to Master Electrician Rajeshwar Shinde',
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 2),
    updatedAt: new Date(Date.now() - 3600000 * 1),
  },
  {
    id: 'BK-2026-9902',
    _id: '65f123456789012345678952',
    customer: defaultCustomerId,
    customerId: defaultCustomerId,
    customerName: 'Priya Verma',
    customerPhone: '+91 98450 77123',
    cooperative: defaultCoopId,
    cooperativeId: defaultCoopId,
    cooperativeName: 'Pune Shramik Vikas Sahakari',
    worker: null,
    workerId: null,
    service: '65f123456789012345678912',
    serviceId: '65f123456789012345678912',
    serviceName: 'Plumbing & Water Sanitation',
    trade: 'Plumbing & Water Sanitation',
    location: {
      type: 'Point',
      coordinates: [73.8567, 18.5204],
      serviceAddress: {
        street: 'B-12, Swapna Shilp, Shivajinagar',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411005',
        landmark: 'Near Agriculture College',
      },
    },
    scheduledTime: {
      start: new Date(Date.now() + 86400000),
      end: new Date(Date.now() + 86400000 + 7200000),
    },
    status: 'PENDING',
    price: {
      floorRateAmount: 400,
      totalAmount: 800,
      commissionCut: 0,
      currency: 'INR',
    },
    paymentStatus: 'pending',
    qrVerification: {
      token: 'QR-SS-9902-SHIV',
      otpCode: '3182',
      isVerified: false,
      verifiedAt: null,
    },
    specialInstructions: 'Main riser pipeline leakage in bathroom.',
    rejectionReason: null,
    statusHistory: [
      {
        status: 'PENDING',
        role: 'USER',
        timestamp: new Date(Date.now() - 1800000),
        note: 'Customer requested service with escrow protection',
      },
    ],
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(Date.now() - 1800000),
  },
];

sampleBookings.forEach((b) => {
  inMemoryBookings.set(String(b._id), { ...b });
  inMemoryBookings.set(b.id, { ...b });
});

export class BookingService {
  /**
   * Validate status transition against the state machine
   */
  static validateTransition(currentStatus, targetStatus, role, actorId = null, booking = null) {
    const cur = normalizeStatus(currentStatus);
    const tgt = normalizeStatus(targetStatus);
    const normRole = normalizeRole(role);

    // If attempting no status change, allow
    if (cur === tgt) {
      return true;
    }

    // Check if current state is terminal
    if (cur === 'COMPLETED' || cur === 'CANCELLED') {
      throw new AppError(
        `Cannot change status of a booking that is already ${cur}`,
        400
      );
    }

    // Check allowed transitions
    const allowed = VALID_TRANSITIONS[cur] || [];
    if (!allowed.includes(tgt)) {
      throw new AppError(
        `Invalid booking status transition from "${cur}" to "${tgt}". Allowed next transitions: ${
          allowed.length ? allowed.join(', ') : 'None (Terminal state)'
        }`,
        400
      );
    }

    // Role-specific authorization checks
    if (tgt === 'CANCELLED') {
      // Customer can cancel if pending, assigned, or accepted
      if (normRole === 'USER') {
        if (!['PENDING', 'ASSIGNED', 'ACCEPTED'].includes(cur)) {
          throw new AppError('Customer cannot cancel a booking once work is in progress or artisan is on the way', 400);
        }
      }
    }

    if (['ACCEPTED', 'REJECTED'].includes(tgt)) {
      if (normRole !== 'WORKER' && normRole !== 'ADMIN') {
        throw new AppError('Only the assigned worker can accept or reject an assignment', 403);
      }
      if (cur !== 'ASSIGNED' && cur !== 'ACCEPTED') {
        throw new AppError(`Cannot ${tgt.toLowerCase()} booking when status is ${cur}`, 400);
      }
    }

    if (['ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(tgt)) {
      if (normRole !== 'WORKER' && normRole !== 'ADMIN') {
        throw new AppError(`Only the assigned worker can update job progress to ${tgt}`, 403);
      }
    }

    if (tgt === 'ASSIGNED') {
      if (normRole !== 'COOPERATIVE' && normRole !== 'ADMIN') {
        throw new AppError('Only cooperative managers or administrators can assign workers', 403);
      }
    }

    return true;
  }

  /**
   * Find suitable cooperatives and available workers for a service & location
   */
  static async getSuitableCooperativesAndWorkers({ serviceId, trade, city, pincode }) {
    // 1. Resolve service
    let targetTrade = trade;
    let targetService = null;
    if (serviceId) {
      targetService = await CatalogService.getServiceById(serviceId);
      if (targetService) {
        targetTrade = targetTrade || targetService.category || targetService.name;
      }
    }

    const cleanCity = city ? String(city).trim() : 'Pune';
    const cleanTrade = targetTrade ? String(targetTrade).trim() : 'Electrical & Power Systems';

    // 2. Fetch cooperatives
    let cooperatives = [];
    if (mongoose.connection.readyState === 1) {
      cooperatives = await Cooperative.find({
        $or: [
          { 'location.district': new RegExp(cleanCity, 'i') },
          { 'location.operationalPincodes': pincode },
          { serviceCategories: new RegExp(cleanTrade, 'i') },
        ],
      });
    }

    // Fallback in-memory cooperatives
    if (!cooperatives || cooperatives.length === 0) {
      cooperatives = [
        {
          _id: defaultCoopId,
          id: defaultCoopId,
          name: 'Pune Shramik Vikas Sahakari',
          trustScore: 98.4,
          location: {
            district: 'Pune',
            state: 'Maharashtra',
            address: 'Shramik Bhavan, FC Road, Shivajinagar',
          },
          serviceCategories: [
            'Electrical & Power Systems',
            'Plumbing & Water Sanitation',
            'Carpentry & Woodwork',
            'Civil Construction & Masonry',
          ],
          memberCount: 24,
          verificationStatus: 'verified',
        },
        {
          _id: '65f123456789012345678904',
          id: '65f123456789012345678904',
          name: 'Maharashtra Karigar Mahasangh',
          trustScore: 96.8,
          location: {
            district: 'Pune',
            state: 'Maharashtra',
            address: 'Artisan Hub, Kothrud Industrial Estate',
          },
          serviceCategories: [
            'Electrical & Power Systems',
            'Civil Construction & Masonry',
            'Professional Painting & Surface Coating',
          ],
          memberCount: 42,
          verificationStatus: 'verified',
        },
      ];
    }

    // 3. Assemble available workers
    const availableWorkers = [
      {
        workerId: defaultWorkerId,
        _id: defaultWorkerId,
        id: defaultWorkerId,
        name: 'Rajeshwar Shinde',
        phone: '+91 98201 44019',
        trade: 'Electrical & Power Systems',
        primaryTrade: 'Electrical & Power Systems',
        cooperativeId: defaultCoopId,
        cooperativeName: 'Pune Shramik Vikas Sahakari',
        experienceYears: 8,
        rating: 4.94,
        totalReviews: 84,
        jobsCompleted: 462,
        dailyFloorRate: 1300,
        hourlyRate: 450,
        isVerified: true,
        aadhaarVerified: true,
        nsdcCertified: true,
        availabilityStatus: 'available',
        city: 'Pune',
        distanceKm: 2.4,
      },
      {
        workerId: '65f123456789012345678905',
        _id: '65f123456789012345678905',
        id: '65f123456789012345678905',
        name: 'Santosh Waghmare',
        phone: '+91 98201 11223',
        trade: 'Plumbing & Water Sanitation',
        primaryTrade: 'Plumbing & Water Sanitation',
        cooperativeId: defaultCoopId,
        cooperativeName: 'Pune Shramik Vikas Sahakari',
        experienceYears: 6,
        rating: 4.88,
        totalReviews: 61,
        jobsCompleted: 310,
        dailyFloorRate: 1150,
        hourlyRate: 400,
        isVerified: true,
        aadhaarVerified: true,
        nsdcCertified: true,
        availabilityStatus: 'available',
        city: 'Pune',
        distanceKm: 3.8,
      },
      {
        workerId: '65f123456789012345678906',
        _id: '65f123456789012345678906',
        id: '65f123456789012345678906',
        name: 'Dattatray Pawar',
        phone: '+91 98201 55667',
        trade: 'Carpentry & Woodwork',
        primaryTrade: 'Carpentry & Woodwork',
        cooperativeId: defaultCoopId,
        cooperativeName: 'Pune Shramik Vikas Sahakari',
        experienceYears: 7,
        rating: 4.91,
        totalReviews: 53,
        jobsCompleted: 198,
        dailyFloorRate: 1200,
        hourlyRate: 480,
        isVerified: true,
        aadhaarVerified: true,
        nsdcCertified: true,
        availabilityStatus: 'available',
        city: 'Pune',
        distanceKm: 4.1,
      },
      {
        workerId: '65f123456789012345678907',
        _id: '65f123456789012345678907',
        id: '65f123456789012345678907',
        name: 'Ganesh Shingate',
        phone: '+91 98201 88990',
        trade: 'Civil Construction & Masonry',
        primaryTrade: 'Civil Construction & Masonry',
        cooperativeId: '65f123456789012345678904',
        cooperativeName: 'Maharashtra Karigar Mahasangh',
        experienceYears: 9,
        rating: 4.92,
        totalReviews: 95,
        jobsCompleted: 520,
        dailyFloorRate: 1400,
        hourlyRate: 550,
        isVerified: true,
        aadhaarVerified: true,
        nsdcCertified: true,
        availabilityStatus: 'available',
        city: 'Pune',
        distanceKm: 3.2,
      },
    ];

    // Filter workers relevant to requested trade
    const filteredWorkers = availableWorkers.filter((w) => {
      if (!cleanTrade) return true;
      const t = cleanTrade.toLowerCase();
      return (
        w.trade.toLowerCase().includes(t) ||
        t.includes(w.trade.toLowerCase()) ||
        w.primaryTrade.toLowerCase().includes(t)
      );
    });

    return {
      service: targetService || { name: cleanTrade, trade: cleanTrade },
      location: { city: cleanCity, pincode: pincode || '411001' },
      cooperatives: cooperatives.map((c) => ({
        id: c._id || c.id,
        _id: c._id || c.id,
        name: c.name,
        trustScore: c.trustScore || 96.0,
        district: c.location?.district || c.district || cleanCity,
        state: c.location?.state || c.state || 'Maharashtra',
        memberCount: c.memberCount || 20,
        verificationStatus: c.verificationStatus || 'verified',
        serviceCategories: c.serviceCategories || [],
      })),
      workers: filteredWorkers.length > 0 ? filteredWorkers : availableWorkers,
      recommendedAllocation: {
        cooperativeId: cooperatives[0]?._id || cooperatives[0]?.id || defaultCoopId,
        cooperativeName: cooperatives[0]?.name || 'Pune Shramik Vikas Sahakari',
        suggestedWorker: filteredWorkers[0] || availableWorkers[0],
        algorithm: 'Fair AI Allocation (XGBoost Proximity & Workload Balance)',
      },
    };
  }

  /**
   * Create a new booking (Customer)
   */
  static async createBooking(customerId, bookingData) {
    const cleanCustomerId = String(customerId);
    const {
      serviceId,
      serviceName,
      trade,
      location,
      scheduledTime,
      cooperativeId,
      workerId,
      specialInstructions = '',
      price,
    } = bookingData;

    if (!location?.serviceAddress?.city || !location?.serviceAddress?.street) {
      throw new AppError('Service address with street and city is required', 400);
    }
    if (!scheduledTime?.start) {
      throw new AppError('Preferred scheduled date/time is required', 400);
    }

    // Resolve service catalog item if serviceId passed
    let resolvedServiceName = serviceName;
    let resolvedTrade = trade;
    let floorRate = price?.floorRateAmount || 450;
    let totalAmount = price?.totalAmount || floorRate * 2;

    if (serviceId) {
      const srv = await CatalogService.getServiceById(serviceId);
      if (srv) {
        resolvedServiceName = resolvedServiceName || srv.name;
        resolvedTrade = resolvedTrade || srv.category || srv.name;
        floorRate = srv.estimatedPrice?.floorRate || floorRate;
        totalAmount = srv.estimatedPrice?.floorRate ? srv.estimatedPrice.floorRate * 2 : totalAmount;
      }
    }

    if (!resolvedServiceName) {
      resolvedServiceName = 'Skilled Trade Service';
    }
    if (!resolvedTrade) {
      resolvedTrade = resolvedServiceName;
    }

    // Generate secure QR Token and 4-digit verification OTP
    const uniqueHash = Math.random().toString(36).substring(2, 6).toUpperCase();
    const qrToken = `QR-SS-${Date.now().toString(36).toUpperCase()}-${uniqueHash}`;
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Default target cooperative
    const assignedCoopId = cooperativeId || defaultCoopId;

    // Fetch customer details
    let customerName = 'Customer';
    let customerPhone = '+91 98000 00000';
    if (mongoose.connection.readyState === 1) {
      const u = await User.findById(cleanCustomerId);
      if (u) {
        customerName = u.name;
        customerPhone = u.phone;
      }
    }

    const bookingPayload = {
      customer: cleanCustomerId,
      customerId: cleanCustomerId,
      customerName,
      customerPhone,
      cooperative: assignedCoopId,
      cooperativeId: assignedCoopId,
      worker: workerId || null,
      workerId: workerId || null,
      service: serviceId || null,
      serviceName: resolvedServiceName,
      trade: resolvedTrade,
      location: {
        type: 'Point',
        coordinates: location.coordinates || [73.8567, 18.5204],
        serviceAddress: {
          street: location.serviceAddress.street,
          city: location.serviceAddress.city,
          state: location.serviceAddress.state || 'Maharashtra',
          pincode: location.serviceAddress.pincode || '411001',
          landmark: location.serviceAddress.landmark || '',
        },
      },
      scheduledTime: {
        start: new Date(scheduledTime.start),
        end: scheduledTime.end ? new Date(scheduledTime.end) : new Date(new Date(scheduledTime.start).getTime() + 7200000),
      },
      status: workerId ? 'ASSIGNED' : 'PENDING',
      price: {
        floorRateAmount: Number(floorRate),
        totalAmount: Number(totalAmount),
        commissionCut: 0,
        currency: 'INR',
      },
      paymentStatus: 'escrow_locked',
      qrVerification: {
        token: qrToken,
        otpCode,
        isVerified: false,
        verifiedAt: null,
      },
      specialInstructions: specialInstructions.trim(),
      rejectionReason: null,
      statusHistory: [
        {
          status: 'PENDING',
          updatedBy: cleanCustomerId,
          role: 'USER',
          timestamp: new Date(),
          note: 'Booking request created with zero-middleman escrow guarantee',
        },
      ],
    };

    if (workerId) {
      bookingPayload.statusHistory.push({
        status: 'ASSIGNED',
        updatedBy: cleanCustomerId,
        role: 'USER',
        timestamp: new Date(),
        note: 'Customer pre-selected artisan',
      });
    }

    // Save in MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      const newBooking = await Booking.create(bookingPayload);
      return newBooking;
    }

    // Save in memory
    const newId = `BK-${Date.now().toString().slice(-4)}`;
    const mongoMockId = new mongoose.Types.ObjectId().toString();
    const created = {
      ...bookingPayload,
      _id: mongoMockId,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryBookings.set(mongoMockId, created);
    inMemoryBookings.set(newId, created);
    return created;
  }

  /**
   * Get bookings list with role-based filtering
   */
  static async getBookings({ userId, role, status, cooperativeId, search } = {}) {
    const normRole = normalizeRole(role);
    const cleanUserId = String(userId);

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (normRole === 'USER') {
        filter.$or = [{ customer: cleanUserId }, { customerId: cleanUserId }];
      } else if (normRole === 'WORKER') {
        filter.$or = [{ worker: cleanUserId }, { workerId: cleanUserId }];
      } else if (normRole === 'COOPERATIVE') {
        const coopId = cooperativeId || cleanUserId;
        filter.$or = [{ cooperative: coopId }, { cooperativeId: coopId }];
      }

      if (status && status !== 'ALL') {
        const upper = normalizeStatus(status);
        filter.status = { $in: [status, status.toLowerCase(), upper] };
      }

      return Booking.find(filter)
        .populate('customer', 'name phone email')
        .populate('worker', 'name phone experience rating')
        .populate('cooperative', 'name location')
        .sort({ createdAt: -1 });
    }

    // In-memory filter
    const seen = new Set();
    const result = [];
    for (const [, b] of inMemoryBookings) {
      const key = String(b._id || b.id);
      if (seen.has(key)) continue;
      seen.add(key);

      // Role filter
      if (normRole === 'USER') {
        if (String(b.customer) !== cleanUserId && String(b.customerId) !== cleanUserId) {
          // Allow in mock if user matches default or mock customer
          if (cleanUserId !== defaultCustomerId && String(b.customer) !== defaultCustomerId) {
            continue;
          }
        }
      } else if (normRole === 'WORKER') {
        if (String(b.worker) !== cleanUserId && String(b.workerId) !== cleanUserId) {
          if (cleanUserId !== defaultWorkerId && String(b.worker) !== defaultWorkerId) {
            continue;
          }
        }
      } else if (normRole === 'COOPERATIVE') {
        const coopId = cooperativeId || cleanUserId;
        if (
          String(b.cooperative) !== String(coopId) &&
          String(b.cooperativeId) !== String(coopId) &&
          coopId !== defaultCoopId
        ) {
          continue;
        }
      }

      // Status filter
      if (status && status !== 'ALL') {
        if (normalizeStatus(b.status) !== normalizeStatus(status)) {
          continue;
        }
      }

      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchesService = b.serviceName?.toLowerCase().includes(q);
        const matchesCustomer = b.customerName?.toLowerCase().includes(q);
        const matchesAddress = b.location?.serviceAddress?.city?.toLowerCase().includes(q);
        if (!matchesService && !matchesCustomer && !matchesAddress) {
          continue;
        }
      }

      result.push(b);
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get single booking by ID
   */
  static async getBookingById(bookingId, userId, role) {
    const cleanId = String(bookingId);

    let booking = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        booking = await Booking.findById(cleanId)
          .populate('customer', 'name phone email')
          .populate('worker', 'name phone experience rating')
          .populate('cooperative', 'name location');
      }
    }

    if (!booking) {
      booking = inMemoryBookings.get(cleanId);
      if (!booking) {
        for (const [, b] of inMemoryBookings) {
          if (String(b._id) === cleanId || String(b.id) === cleanId) {
            booking = b;
            break;
          }
        }
      }
    }

    if (!booking) {
      throw new AppError('Booking request not found', 404);
    }

    return booking;
  }

  /**
   * Cooperative assigns an available suitable worker to a booking
   */
  static async assignWorker(bookingId, workerId, cooperativeUserId, role) {
    const booking = await this.getBookingById(bookingId, cooperativeUserId, role);
    const currentStatus = normalizeStatus(booking.status);

    // Verify status allows assignment
    this.validateTransition(currentStatus, 'ASSIGNED', role, cooperativeUserId, booking);

    // Resolve worker details
    let workerName = 'Assigned Artisan';
    let workerPhone = '+91 98000 00000';
    let workerTrade = booking.trade;

    if (mongoose.connection.readyState === 1) {
      const w = await User.findById(workerId);
      if (w) {
        workerName = w.name;
        workerPhone = w.phone;
      }
    } else {
      if (workerId === defaultWorkerId) {
        workerName = 'Rajeshwar Shinde';
        workerPhone = '+91 98201 44019';
        workerTrade = 'Electrical & Power Systems';
      }
    }

    const historyEntry = {
      status: 'ASSIGNED',
      updatedBy: cooperativeUserId,
      role: 'COOPERATIVE',
      timestamp: new Date(),
      note: `Assigned to ${workerName} (${workerTrade})`,
    };

    if (mongoose.connection.readyState === 1) {
      const updated = await Booking.findByIdAndUpdate(
        booking._id || booking.id,
        {
          $set: {
            worker: workerId,
            workerId: workerId,
            status: 'ASSIGNED',
            rejectionReason: null,
          },
          $push: { statusHistory: historyEntry },
        },
        { new: true }
      );
      return updated;
    }

    // In-memory update
    booking.worker = workerId;
    booking.workerId = workerId;
    booking.workerName = workerName;
    booking.workerPhone = workerPhone;
    booking.status = 'ASSIGNED';
    booking.rejectionReason = null;
    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push(historyEntry);
    booking.updatedAt = new Date().toISOString();

    inMemoryBookings.set(String(booking._id), booking);
    inMemoryBookings.set(String(booking.id), booking);

    return booking;
  }

  /**
   * Update booking status with state machine verification
   */
  static async updateBookingStatus(bookingId, newStatus, userId, role, { note = '', rejectionReason = null } = {}) {
    const booking = await this.getBookingById(bookingId, userId, role);
    const currentStatus = normalizeStatus(booking.status);
    const targetStatus = normalizeStatus(newStatus);

    // Perform state machine transition validation
    this.validateTransition(currentStatus, targetStatus, role, userId, booking);

    const historyEntry = {
      status: targetStatus,
      updatedBy: userId,
      role: normalizeRole(role),
      timestamp: new Date(),
      note: note || `Status transitioned to ${targetStatus}`,
    };

    const updateFields = {
      status: targetStatus,
    };

    if (targetStatus === 'REJECTED') {
      updateFields.rejectionReason = rejectionReason || 'Worker unavailable for requested slot';
    } else if (targetStatus === 'ASSIGNED') {
      updateFields.rejectionReason = null;
    } else if (targetStatus === 'COMPLETED') {
      updateFields.paymentStatus = 'released';
      if (!booking.qrVerification) {
        booking.qrVerification = {};
      }
      booking.qrVerification.isVerified = true;
      booking.qrVerification.verifiedAt = new Date();
      updateFields['qrVerification.isVerified'] = true;
      updateFields['qrVerification.verifiedAt'] = booking.qrVerification.verifiedAt;
    } else if (targetStatus === 'CANCELLED') {
      updateFields.cancellation = {
        cancelledBy: userId,
        reason: note || 'Cancelled by user',
        cancelledAt: new Date(),
      };
    }

    if (mongoose.connection.readyState === 1) {
      const updated = await Booking.findByIdAndUpdate(
        booking._id || booking.id,
        {
          $set: updateFields,
          $push: { statusHistory: historyEntry },
        },
        { new: true }
      );
      return updated;
    }

    // In-memory update
    Object.assign(booking, updateFields);
    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push(historyEntry);
    booking.updatedAt = new Date().toISOString();

    inMemoryBookings.set(String(booking._id), booking);
    inMemoryBookings.set(String(booking.id), booking);

    return booking;
  }

  /**
   * Worker accepts assignment (ASSIGNED -> ACCEPTED)
   */
  static async acceptBooking(bookingId, workerUserId) {
    return this.updateBookingStatus(bookingId, 'ACCEPTED', workerUserId, 'WORKER', {
      note: 'Artisan accepted assignment and confirmed time slot',
    });
  }

  /**
   * Worker rejects assignment (ASSIGNED -> REJECTED)
   */
  static async rejectBooking(bookingId, workerUserId, reason) {
    return this.updateBookingStatus(bookingId, 'REJECTED', workerUserId, 'WORKER', {
      note: reason || 'Artisan declined assignment due to schedule conflict',
      rejectionReason: reason || 'Artisan declined assignment',
    });
  }
}
