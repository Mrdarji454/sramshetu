import { randomBytes } from 'node:crypto';
import { bookingNotification } from './notification.service.js';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.model.js';
import { User } from '../models/User.model.js';
import { Worker } from '../models/Worker.model.js';
import { Cooperative } from '../models/Cooperative.model.js';
import { CatalogService } from './service.service.js';
import { AppError } from '../utils/AppError.js';
import { refundPaymentForBooking } from './payment.service.js';

// State machine valid transition graph
export const VALID_TRANSITIONS = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'REJECTED', 'ASSIGNED', 'CANCELLED'],
  REJECTED: ['ASSIGNED', 'CANCELLED'],
  ACCEPTED: ['ON_THE_WAY', 'REJECTED', 'CANCELLED'],
  ON_THE_WAY: ['ARRIVED', 'IN_PROGRESS', 'CANCELLED'],
  ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
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
  const normalized = String(status).trim().toUpperCase();
  return normalized === 'CONFIRMED' ? 'ACCEPTED' : normalized;
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
        `Invalid booking status transition from "${cur}" to "${tgt}". Allowed next transitions: ${allowed.length ? allowed.join(', ') : 'None (Terminal state)'
        }`,
        400
      );
    }

    // Role-specific authorization checks
    if (tgt === 'CANCELLED') {
      // Customer can cancel if pending, assigned, or accepted
      if (normRole === 'USER') {
        if (!['PENDING', 'ASSIGNED', 'ACCEPTED', 'REJECTED'].includes(cur)) {
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

    if (['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(tgt)) {
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
  static async getSuitableCooperativesAndWorkers({ serviceId, trade, city, pincode, latitude, longitude }) {
    const service = serviceId ? await CatalogService.getServiceById(serviceId) : null;
    const requestedTrade = trade || service?.category || service?.name || '';
    const presets = { '411038': [73.8077, 18.5074], '411004': [73.8415, 18.5167], '411005': [73.8446, 18.5314], '411014': [73.9143, 18.5679], '411028': [73.9259, 18.5089] };
    const fallback = presets[pincode] || [73.8567, 18.5204];
    const { MatchingService } = await import('./matching.service.js');
    const matches = await MatchingService.findNearbyMatches({
      latitude: latitude ?? fallback[1], longitude: longitude ?? fallback[0],
      trade: requestedTrade, city, availableOnly: true, maxRadiusKm: 30, sortBy: 'score',
    });
    const workers = matches.workers.map(item => ({
      ...item.worker, rating: item.rating,
      cooperativeId: item.cooperative?.id || null, cooperativeName: item.cooperative?.name,
      distanceKm: item.distance, availabilityStatus: item.availability.status,
    }));
    return {
      service: service || { name: requestedTrade, trade: requestedTrade },
      location: { city, pincode }, cooperatives: matches.cooperatives, workers,
      recommendedAllocation: {
        cooperativeId: matches.cooperatives[0]?.id || null,
        cooperativeName: matches.cooperatives[0]?.name || null,
        suggestedWorker: workers[0] || null,
        algorithm: matches.rankingEngine,
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
      description = '',
      workType = 'Repair & Troubleshooting',
      photos = [],
      location,
      scheduledTime,
      cooperativeId,
      workerId,
      paymentMethodPreference = 'ONLINE',
      specialInstructions = '',
    } = bookingData;

    if (!location?.serviceAddress?.city || !location?.serviceAddress?.street) {
      throw new AppError('Service address with street and city is required', 400);
    }
    if (!scheduledTime?.start || isNaN(new Date(scheduledTime.start).getTime())) {
      throw new AppError('A valid preferred scheduled start date/time is required', 400);
    }

    // Resolve service catalog item if serviceId passed
    let resolvedServiceName = serviceName;
    let resolvedTrade = trade;
    let catalogService = serviceId ? await CatalogService.getServiceById(serviceId) : null;
    if (serviceId && !catalogService) throw new AppError('Selected service was not found', 404);
    if (!catalogService) {
      const labels = [serviceName, trade].filter(Boolean).map(value => String(value).trim().toLowerCase());
      catalogService = (await CatalogService.getServices()).find(service =>
        [service.name, service.category].some(label => labels.includes(String(label).trim().toLowerCase())));
    }
    // Charge the existing two-hour estimate from server-owned rates. Client price
    // values are display hints and must never determine a Razorpay order amount.
    const floorRate = Number(catalogService?.estimatedPrice?.floorRate ?? 450);
    const totalAmount = Math.round(floorRate * 2 * 100) / 100;
    if (!Number.isFinite(floorRate) || floorRate <= 0 || !Number.isSafeInteger(Math.round(totalAmount * 100))) {
      throw new AppError('Service pricing is unavailable', 409);
    }
    if (catalogService) {
      resolvedServiceName = resolvedServiceName || catalogService.name;
      resolvedTrade = resolvedTrade || catalogService.category || catalogService.name;
    }

    if (!resolvedServiceName) {
      resolvedServiceName = 'Skilled Trade Service';
    }
    if (!resolvedTrade) {
      resolvedTrade = resolvedServiceName;
    }

    // Keep the existing QR reference; work OTPs are issued separately on demand.
    const uniqueHash = randomBytes(16).toString('hex');
    const qrToken = `QR-SS-${Date.now().toString(36).toUpperCase()}-${uniqueHash}`;
    const otpCode = null;

    // Distinct paths: Direct Worker vs Cooperative Assignment
    const isDirectWorkerBooking = Boolean(workerId);
    const assignedCoopId = cooperativeId || (isDirectWorkerBooking ? null : defaultCoopId);
    const initialStatus = isDirectWorkerBooking ? 'ASSIGNED' : 'PENDING';

    // Fetch customer details
    let customerName = 'Customer';
    let customerPhone = '';
    let customerEmail = '';
    let workerName = '';
    let workerPhone = '';
    let cooperativeName = '';
    if (mongoose.connection.readyState === 1) {
      const u = await User.findById(cleanCustomerId);
      if (u) {
        customerName = u.name;
        customerPhone = u.phone;
        customerEmail = u.email;
      }
    }

    if (mongoose.connection.readyState === 1) {
      if (workerId) {
        if (!mongoose.isValidObjectId(workerId)) throw new AppError('Invalid worker reference', 400);
        const profile = await Worker.findOne({ $or: [{ _id: workerId }, { user: workerId }] }).populate('user', 'name phone');
        if (!profile) throw new AppError('Selected worker was not found', 404);
        if (profile.availability?.status !== 'available') throw new AppError('Selected worker is currently unavailable', 409);
        workerName = profile.user?.name || '';
        workerPhone = profile.user?.phone || '';
      }
      if (assignedCoopId) {
        if (!mongoose.isValidObjectId(assignedCoopId)) throw new AppError('Invalid cooperative reference', 400);
        const cooperative = await Cooperative.findById(assignedCoopId);
        if (!cooperative) throw new AppError('Selected cooperative was not found', 404);
        cooperativeName = cooperative.name;
      }
    } else {
      const { inMemoryWorkers } = await import('./worker.service.js');
      const { inMemoryCooperatives } = await import('./cooperative.service.js');
      const profile = [...inMemoryWorkers.values()].find(w => String(w._id || w.id) === String(workerId));
      workerName = profile?.name || '';
      workerPhone = profile?.phone || '';
      cooperativeName = [...inMemoryCooperatives.values()].find(c => String(c._id || c.id) === String(assignedCoopId))?.name || '';
    }

    // Preserve exact [longitude, latitude] coordinates
    let cleanCoords = [0, 0];
    if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      const lon = Number(location.coordinates[0]);
      const lat = Number(location.coordinates[1]);
      if (Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lon) <= 180 && Math.abs(lat) <= 90) {
        cleanCoords = [lon, lat];
      } else throw new AppError("Invalid location coordinates", 400);
    }

    const bookingPayload = {
      customer: cleanCustomerId,
      customerId: cleanCustomerId,
      customerName,
      customerPhone,
      customerEmail,
      workerName,
      workerPhone,
      cooperativeName,
      cooperative: assignedCoopId,
      cooperativeId: assignedCoopId,
      worker: isDirectWorkerBooking ? workerId : null,
      workerId: isDirectWorkerBooking ? workerId : null,
      service: catalogService?._id || null,
      serviceName: resolvedServiceName,
      trade: resolvedTrade,
      description: (description || '').trim(),
      workType: workType || 'Repair & Troubleshooting',
      photos: Array.isArray(photos) ? photos : [],
      location: {
        type: 'Point',
        coordinates: cleanCoords,
        serviceAddress: {
          street: location.serviceAddress.street,
          city: location.serviceAddress.city,
          district: location.serviceAddress.district || location.serviceAddress.city,
          state: location.serviceAddress.state || 'Maharashtra',
          pincode: location.serviceAddress.pincode || '',
          landmark: location.serviceAddress.landmark || '',
        },
      },
      scheduledTime: {
        start: new Date(scheduledTime.start),
        end: scheduledTime.end ? new Date(scheduledTime.end) : new Date(new Date(scheduledTime.start).getTime() + 7200000),
      },
      status: initialStatus,
      trackingStatus: initialStatus,
      customerLocation: cleanCoords.some(value => value !== 0) ? cleanCoords : undefined,
      price: {
        floorRateAmount: Number(floorRate),
        totalAmount: Number(totalAmount),
        commissionCut: 0,
        currency: 'INR',
      },
      paymentStatus: 'PENDING',
      paymentMethodPreference: paymentMethodPreference === 'CASH' ? 'CASH' : 'ONLINE',
      paymentMethod: null,
      refundStatus: 'not_applicable',
      qrVerification: {
        token: qrToken,
        otpCode,
        isVerified: false,
        verifiedAt: null,
      },
      specialInstructions: (specialInstructions || '').trim(),
      rejectionReason: null,
      statusHistory: [
        {
          status: 'PENDING',
          updatedBy: cleanCustomerId,
          role: 'USER',
          timestamp: new Date(),
          note: isDirectWorkerBooking
            ? 'Direct artisan booking created - awaiting artisan confirmation'
            : 'Cooperative assignment requested - awaiting society dispatch',
        },
      ],
    };

    if (isDirectWorkerBooking) {
      bookingPayload.statusHistory.push({
        status: 'ASSIGNED',
        updatedBy: cleanCustomerId,
        role: 'USER',
        timestamp: new Date(),
        note: `Direct artisan pre-selection (Worker ID: ${workerId})`,
      });
    }

    bookingPayload.timelineEvents = [...bookingPayload.statusHistory];

    // Save in MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      const newBooking = await Booking.create(bookingPayload);
      await bookingNotification(newBooking, 'BOOKING_SUBMITTED');
      await bookingNotification(newBooking, 'NEW_BOOKING');
      if (isDirectWorkerBooking || assignedCoopId) await bookingNotification(newBooking, isDirectWorkerBooking ? 'ASSIGNED' : 'COOPERATIVE_ASSIGNED');
      return newBooking;
    }

    // Save in memory
    const newId = `BK-${randomBytes(8).toString('hex')}`;
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
    if (!userId || !['USER', 'WORKER', 'COOPERATIVE', 'ADMIN'].includes(normRole)) {
      throw new AppError('An authorized account is required to view bookings', 403);
    }

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (normRole === 'USER') {
        filter.$or = [{ customer: cleanUserId }, { customerId: cleanUserId }];
      } else if (normRole === 'WORKER') {
        // Find worker profile if exists
        const wp = await Worker.findOne({ $or: [{ user: cleanUserId }, { _id: cleanUserId }] }).catch(() => null);
        const wpId = wp ? String(wp._id) : null;

        const workerOrs = [
          { worker: cleanUserId },
          { workerId: cleanUserId },
        ];
        if (wpId) {
          workerOrs.push({ worker: wpId }, { workerId: wpId });
        }
        filter.$or = workerOrs;
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

        .populate('cooperative', 'name location')
        .sort({ createdAt: -1 });
    }

    // In-memory filter
    const { inMemoryWorkers } = await import('./worker.service.js');
    const actorWorkerIds = [...inMemoryWorkers.values()].filter(w => String(w.user?._id || w.user || w.userId) === cleanUserId).map(w => String(w._id || w.id));
    const seen = new Set();
    const result = [];
    for (const [, b] of inMemoryBookings) {
      const key = String(b._id || b.id);
      if (seen.has(key)) continue;
      seen.add(key);

      // Role filter
      if (normRole === 'USER') {
        if (String(b.customer) !== cleanUserId && String(b.customerId) !== cleanUserId) {
          continue;
        }
      } else if (normRole === 'WORKER') {
        const matchDirect = String(b.worker) === cleanUserId || String(b.workerId) === cleanUserId || actorWorkerIds.includes(String(b.worker));
        const matchDefault =
          (cleanUserId === defaultWorkerId || cleanUserId === 'W-MH-4019') &&
          (String(b.worker) === defaultWorkerId ||
            String(b.workerId) === defaultWorkerId ||
            String(b.worker) === 'W-MH-4019' ||
            String(b.workerId) === 'W-MH-4019' ||
            b.workerName === 'Rajeshwar Shinde');

        // If not directly matched, check if worker is assigned
        if (!matchDirect && !matchDefault) {
          // If cleanUserId is a newly created worker session and the booking was assigned to this worker
          if (b.worker !== cleanUserId && b.workerId !== cleanUserId) {
            continue;
          }
        }
      } else if (normRole === 'COOPERATIVE') {
        const coopId = cooperativeId || cleanUserId;
        if (
          String(b.cooperative) !== String(coopId) &&
          String(b.cooperativeId) !== String(coopId)
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

          .populate('cooperative', 'name location');
      }
    }

    if (!booking && mongoose.connection.readyState !== 1) {
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

    if (userId && normalizeRole(role) !== 'ADMIN') {
      const actor = String(userId);
      const ref = value => String(value?._id || value || '');
      let allowed = false;
      if (normalizeRole(role) === 'USER') allowed = ref(booking.customer) === actor || ref(booking.customerId) === actor;
      if (normalizeRole(role) === 'WORKER') {
        allowed = ref(booking.worker) === actor || ref(booking.workerId) === actor;
        if (!allowed && mongoose.connection.readyState === 1) {
          const profile = await Worker.findOne({ user: actor }).select('_id');
          allowed = Boolean(profile && ref(booking.worker) === String(profile._id));
        } else if (!allowed) {
          const { inMemoryWorkers } = await import('./worker.service.js');
          allowed = [...inMemoryWorkers.values()].some(w => ref(w.user || w.userId) === actor && ref(w._id || w.id) === ref(booking.worker));
        }
      }
      if (normalizeRole(role) === 'COOPERATIVE') {
        allowed = ref(booking.cooperative) === actor || ref(booking.cooperativeId) === actor;
        if (!allowed && mongoose.connection.readyState === 1) {
          const manager = await User.findById(actor).select('cooperativeId');
          allowed = Boolean(manager?.cooperativeId && ref(manager.cooperativeId) === ref(booking.cooperative));
        }
      }
      if (!allowed) throw new AppError('You do not have access to this booking', 403);
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
      // Try finding by User model first, then Worker model
      const w = await User.findById(workerId).catch(() => null);
      if (w) {
        workerName = w.name;
        workerPhone = w.phone;
      } else {
        const wp = await Worker.findById(workerId).populate('user', 'name phone').catch(() => null);
        if (wp) {
          workerName = wp.user?.name || workerName;
          workerPhone = wp.user?.phone || workerPhone;
          workerTrade = wp.experience?.primaryTrade || workerTrade;
        }
      }
    } else {
      // In-memory: Search cooperative member rosters for matching workerId
      let resolved = false;

      // Import in-memory cooperatives to search member rosters
      const { inMemoryCooperatives } = await import('./cooperative.service.js');
      for (const [, coop] of inMemoryCooperatives) {
        if (!coop.members) continue;
        const member = coop.members.find(
          (m) => String(m.id) === String(workerId) || String(m._id) === String(workerId)
        );
        if (member) {
          workerName = member.name;
          workerPhone = member.phone || workerPhone;
          workerTrade = member.trade || workerTrade;
          resolved = true;
          break;
        }
      }

      // Fallback to hardcoded default
      if (!resolved && workerId === defaultWorkerId) {
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
      const updated = await Booking.findOneAndUpdate(
        { _id: booking._id || booking.id, status: booking.status },
        {
          $set: {
            worker: workerId,
            workerId: workerId,
            workerName,
            workerPhone,
            status: 'ASSIGNED',
            trackingStatus: 'ASSIGNED',
            rejectionReason: null,
          },
          $push: { statusHistory: historyEntry, timelineEvents: historyEntry },
        },
        { new: true }
      );
      if (!updated) throw new AppError('Booking changed; refresh before retrying', 409);
      await bookingNotification(updated, 'ASSIGNED');
      return updated;
    }

    // In-memory update
    booking.worker = workerId;
    booking.workerId = workerId;
    booking.workerName = workerName;
    booking.workerPhone = workerPhone;
    booking.status = 'ASSIGNED';
    booking.trackingStatus = 'ASSIGNED';
    booking.rejectionReason = null;
    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push(historyEntry);
    (booking.timelineEvents ||= []).push(historyEntry);
    booking.updatedAt = new Date().toISOString();

    inMemoryBookings.set(String(booking._id), booking);
    inMemoryBookings.set(String(booking.id), booking);

    return booking;
  }

  /**
   * Update booking status with state machine verification
   */
  static async updateBookingStatus(bookingId, newStatus, userId, role, { note = '', rejectionReason = null, scheduledTime } = {}) {
    const booking = await this.getBookingById(bookingId, userId, role);
    if (scheduledTime) return this.rescheduleBooking(booking, scheduledTime, userId, role);
    const currentStatus = normalizeStatus(booking.status);
    const targetStatus = normalizeStatus(newStatus);
    if (currentStatus === targetStatus) return booking;

    if (['IN_PROGRESS', 'COMPLETED'].includes(targetStatus)) throw new AppError('Use customer OTP verification to start or complete work', 403);

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
      trackingStatus: targetStatus,
    };

    if (targetStatus === 'REJECTED') {
      updateFields.rejectionReason = rejectionReason || 'Worker unavailable for requested slot';
    } else if (targetStatus === 'ASSIGNED') {
      updateFields.rejectionReason = null;
    } else if (targetStatus === 'CANCELLED') {
      updateFields.cancellation = {
        cancelledBy: userId,
        reason: note || 'Cancelled by user',
        cancelledAt: new Date(),
      };
      updateFields.refundStatus = ['held', 'escrow_locked'].includes(booking.paymentStatus)
        ? 'pending' : booking.refundStatus || 'not_applicable';
    }

    if (mongoose.connection.readyState === 1) {
      const updated = await Booking.findOneAndUpdate(
        { _id: booking._id || booking.id, status: booking.status },
        {
          $set: updateFields,
          $push: { statusHistory: historyEntry, timelineEvents: historyEntry },
        },
        { new: true }
      );
      if (!updated) throw new AppError('Booking changed; refresh before retrying', 409);
      await bookingNotification(updated, targetStatus);
      if (targetStatus === 'CANCELLED') {
        await refundPaymentForBooking(updated);
        return Booking.findById(updated._id);
      }
      return updated;
    }

    // In-memory update
    Object.assign(booking, updateFields);
    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push(historyEntry);
    (booking.timelineEvents ||= []).push(historyEntry);
    booking.updatedAt = new Date().toISOString();

    inMemoryBookings.set(String(booking._id), booking);
    inMemoryBookings.set(String(booking.id), booking);

    return booking;
  }

  /**
   * Worker accepts assignment (ASSIGNED -> ACCEPTED)
   */
  static async rescheduleBooking(booking, scheduledTime, actor, role) {
    if (!['USER', 'ADMIN'].includes(normalizeRole(role))) throw new AppError('Only the customer or administrator may reschedule', 403);
    if (!['PENDING', 'ASSIGNED', 'ACCEPTED', 'REJECTED'].includes(normalizeStatus(booking.status))) throw new AppError('This booking can no longer be rescheduled', 409);
    const start = new Date(scheduledTime.start);
    const end = new Date(scheduledTime.end || start.getTime() + 7200000);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start <= new Date() || end <= start) throw new AppError('Provide a valid future booking time', 400);
    const entry = { status: booking.status, updatedBy: actor, role: normalizeRole(role), timestamp: new Date(), note: 'Customer rescheduled booking' };
    if (mongoose.connection.readyState === 1) {
      const updated = await Booking.findOneAndUpdate({ _id: booking._id, status: booking.status, 'scheduledTime.start': booking.scheduledTime.start }, { $set: { scheduledTime: { start, end } }, $push: { statusHistory: entry, timelineEvents: entry } }, { new: true });
      if (!updated) throw new AppError('Booking changed; refresh before retrying', 409);
      await bookingNotification(updated, 'RESCHEDULED');
      return updated;
    }
    booking.scheduledTime = { start, end };
    (booking.statusHistory ||= []).push(entry);
    return booking;
  }

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
