import mongoose from 'mongoose';
import { Booking } from '../models/Booking.model.js';
import { Worker } from '../models/Worker.model.js';
import { Cooperative } from '../models/Cooperative.model.js';
import { notifyAdmins, notifyCooperative, notifyWorker, safelyNotify } from './notification.service.js';
import { inMemoryWorkers } from './worker.service.js';

const DEMAND_STATUSES = ['PENDING', 'pending', 'ASSIGNED', 'assigned', 'ACCEPTED', 'accepted'];
const SHIFT_VALID_DAYS = 1000 * 60 * 60 * 24;

const getDemoZoneShiftWorkers = () => {
  const workers = [];

  for (const [, worker] of inMemoryWorkers.entries()) {
    const status = normalizeShiftStatus(worker?.shiftStatus);
    if (status === 'PENDING' || status === 'ACTIVE' || worker?.temporaryZone) {
      workers.push(worker);
    }
  }

  return workers;
};

const toLabel = (value) => {
  if (!value) return null;
  const label = String(value).trim();
  return label || null;
};

const distanceKm = (first, second) => {
  if (!first || !second || first.length < 2 || second.length < 2) return Number.POSITIVE_INFINITY;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second[1] - first[1]);
  const longitudeDelta = radians(second[0] - first[0]);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(first[1])) * Math.cos(radians(second[1])) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const skillMatchesBooking = (worker, booking) => {
  const workerSkills = (worker.skills || []).map((skill) => String(skill.name || '').toLowerCase());
  const bookingTrade = String(booking.trade || booking.serviceName || '').toLowerCase();
  const bookingSkillAliases = [bookingTrade];
  if (workerSkills.length === 0) return false;
  return workerSkills.some((skill) => bookingSkillAliases.some((alias) => alias.includes(skill) || skill.includes(alias)));
};

const zoneCoordinates = (booking) => {
  const location = booking?.location || {};
  const serviceAddress = location.serviceAddress || {};
  const candidates = [
    [location?.coordinates?.[0], location?.coordinates?.[1]],
    [serviceAddress?.longitude, serviceAddress?.latitude],
    [serviceAddress?.coordinates?.[0], serviceAddress?.coordinates?.[1]],
  ];
  const valid = candidates.find(([lng, lat]) => Number.isFinite(Number(lng)) && Number.isFinite(Number(lat)));
  if (!valid) return null;
  return { longitude: Number(valid[0]), latitude: Number(valid[1]) };
};

const zoneFromBooking = (booking) => {
  const location = booking?.location || {};
  const serviceAddress = location.serviceAddress || {};
  const zone = toLabel(serviceAddress.district || serviceAddress.city || location.city || booking?.district || booking?.serviceArea || 'Unspecified');
  return zone;
};

const normalizeShiftStatus = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (['NONE', 'PENDING', 'ACTIVE', 'DECLINED', 'EXPIRED'].includes(normalized)) return normalized;
  return 'NONE';
};

const shouldSkipZoneShiftRecommendation = (worker) => {
  const status = normalizeShiftStatus(worker?.shiftStatus);
  return status === 'PENDING' || status === 'ACTIVE';
};

export async function clearExpiredZoneShifts(now = new Date()) {
  const expired = await Worker.find({
    shiftStatus: 'ACTIVE',
    shiftExpiresAt: { $lt: now },
  }).select('_id currentZone temporaryZone shiftStatus');

  for (const worker of expired) {
    await Worker.updateOne(
      { _id: worker._id },
      {
        $set: {
          shiftStatus: 'EXPIRED',
          temporaryZone: null,
        },
      },
    );
  }

  return expired.length;
}

export async function generateZoneShiftRecommendations(now = new Date()) {
  if (mongoose.connection.readyState !== 1) return [];

  await clearExpiredZoneShifts(now);

  const bookings = await Booking.find({ status: { $in: DEMAND_STATUSES } }).lean();
  const demandByZone = new Map();

  for (const booking of bookings) {
    const zone = zoneFromBooking(booking);
    if (!zone) continue;
    const coordinates = zoneCoordinates(booking);
    const key = zone.toLowerCase();
    if (!demandByZone.has(key)) {
      demandByZone.set(key, { zone, count: 0, trade: booking.trade || booking.serviceName || 'General', coordinates: coordinates ? [coordinates.longitude, coordinates.latitude] : null });
    }
    const entry = demandByZone.get(key);
    entry.count += 1;
    entry.trade = booking.trade || booking.serviceName || entry.trade;
    if (!entry.coordinates && coordinates) entry.coordinates = [coordinates.longitude, coordinates.latitude];
  }

  const demandZones = [...demandByZone.values()]
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  if (demandZones.length === 0) return [];

  const workers = await Worker.find({
    'availability.status': 'available',
    'verificationStatus.status': 'verified',
  }).lean();

  const recommendations = [];

  for (const worker of workers) {
    if (shouldSkipZoneShiftRecommendation(worker)) continue;

    const currentZone = toLabel(worker.currentZone || worker.address?.district || worker.address?.city || worker.location?.address?.district || worker.location?.address?.city || worker.serviceArea?.city || 'Local');
    const workerCoords = worker.location?.coordinates || (Number.isFinite(worker.longitude) && Number.isFinite(worker.latitude) ? [worker.longitude, worker.latitude] : null);
    const radiusLimit = Number(worker.serviceArea?.radiusKm || worker.location?.workingRadiusKm || worker.serviceRadius || 15);
    const suitableZones = demandZones.filter((zone) => {
      if (!zone.zone || zone.zone.toLowerCase() === (currentZone || '').toLowerCase()) return false;
      if (!skillMatchesBooking(worker, { trade: zone.trade })) return false;
      if (!workerCoords || !zone.coordinates) return false;
      return distanceKm(workerCoords, zone.coordinates) <= Math.min(radiusLimit, 15) || distanceKm(workerCoords, zone.coordinates) <= 15;
    });

    if (suitableZones.length === 0) continue;

    suitableZones.sort((a, b) => {
      const scoreA = a.count * 10 - distanceKm(workerCoords, a.coordinates);
      const scoreB = b.count * 10 - distanceKm(workerCoords, b.coordinates);
      return scoreB - scoreA;
    });

    const bestMatch = suitableZones[0];
    const distance = workerCoords && bestMatch.coordinates ? distanceKm(workerCoords, bestMatch.coordinates) : 0;
    const priority = bestMatch.count >= 8 ? 'High' : bestMatch.count >= 4 ? 'Medium' : 'Low';

    const recommendation = {
      workerId: String(worker._id),
      workerName: worker.name || 'Worker',
      cooperativeId: worker.cooperative ? String(worker.cooperative) : worker.cooperativeId ? String(worker.cooperativeId) : null,
      currentZone,
      suggestedZone: bestMatch.zone,
      distanceKm: Number(distance.toFixed(1)),
      priority,
      expectedExtraJobs: bestMatch.count,
      requestedAt: now,
    };

    await Worker.updateOne(
      { _id: worker._id },
      {
        $set: {
          currentZone,
          temporaryZone: bestMatch.zone,
          shiftStatus: 'PENDING',
          shiftAcceptedAt: null,
          shiftExpiresAt: new Date(now.getTime() + 6 * SHIFT_VALID_DAYS),
        },
      },
    );

    if (recommendation.cooperativeId) {
      await safelyNotify(() => notifyCooperative(recommendation.cooperativeId, {
        type: 'ZONE_SHIFT_RECOMMENDATION',
        title: 'Zone shift recommendation',
        message: `${bestMatch.zone} needs more workers. ${recommendation.workerName || 'A worker'} is recommended for reassignment.`,
        eventKey: `zone-shift:${recommendation.cooperativeId}:${worker._id}:${now.toISOString().slice(0, 10)}`,
      }));
    }

    await safelyNotify(() => notifyWorker(worker._id, {
      type: 'ZONE_SHIFT_OFFER',
      title: 'High demand detected in ' + bestMatch.zone,
      message: `High demand detected in ${bestMatch.zone}. Accept Zone Shift?`,
      eventKey: `zone-shift-offer:${worker._id}:${bestMatch.zone}:${now.toISOString().slice(0, 10)}`,
    }));

    await safelyNotify(() => notifyAdmins({
      type: 'ZONE_SHIFT_SHORTAGE',
      title: 'Worker shortage detected in ' + bestMatch.zone,
      message: `Worker shortage detected in ${bestMatch.zone}. Recommended staff transfer is pending.`,
      eventKey: `zone-shift-shortage:${bestMatch.zone}:${now.toISOString().slice(0, 10)}`,
    }));

    recommendations.push(recommendation);
  }

  return recommendations;
}

export async function getPendingZoneShiftOffers(workerUserId) {
  if (mongoose.connection.readyState !== 1) {
    const demoWorkers = getDemoZoneShiftWorkers();
    const demoWorker = demoWorkers.find((worker) => String(worker.user || worker.userId || worker._id) === String(workerUserId)) || demoWorkers[0];
    if (!demoWorker || !demoWorker.temporaryZone) return [];
    return [{
      workerId: String(demoWorker._id || demoWorker.id || demoWorker.user || demoWorker.userId),
      currentZone: demoWorker.currentZone || 'Pune',
      suggestedZone: demoWorker.temporaryZone,
      distanceKm: 18,
      priority: 'High',
      expectedExtraJobs: 4,
      status: normalizeShiftStatus(demoWorker.shiftStatus) || 'PENDING',
      shiftAcceptedAt: demoWorker.shiftAcceptedAt || null,
      shiftExpiresAt: demoWorker.shiftExpiresAt || null,
    }];
  }

  const worker = await Worker.findOne({ $or: [{ user: String(workerUserId) }, { userId: String(workerUserId) }] }).lean();
  if (!worker) {
    const demoWorkers = getDemoZoneShiftWorkers();
    const fallback = demoWorkers[0];
    if (!fallback || !fallback.temporaryZone) return [];
    return [{
      workerId: String(fallback._id || fallback.id || fallback.user || fallback.userId),
      currentZone: fallback.currentZone || 'Pune',
      suggestedZone: fallback.temporaryZone,
      distanceKm: 18,
      priority: 'High',
      expectedExtraJobs: 4,
      status: normalizeShiftStatus(fallback.shiftStatus) || 'PENDING',
      shiftAcceptedAt: fallback.shiftAcceptedAt || null,
      shiftExpiresAt: fallback.shiftExpiresAt || null,
    }];
  }

  const currentZone = toLabel(worker.currentZone || worker.address?.district || worker.address?.city || worker.location?.address?.district || worker.location?.address?.city || worker.serviceArea?.city || 'Local');
  const offeredZone = toLabel(worker.temporaryZone || worker.currentZone || worker.location?.address?.city || 'Local');
  const status = normalizeShiftStatus(worker.shiftStatus);

  if (!offeredZone || !worker.temporaryZone || status === 'DECLINED' || status === 'EXPIRED') return [];

  return [{
    workerId: String(worker._id),
    currentZone,
    suggestedZone: offeredZone,
    distanceKm: 0,
    priority: 'High',
    expectedExtraJobs: 0,
    status,
    shiftAcceptedAt: worker.shiftAcceptedAt || null,
    shiftExpiresAt: worker.shiftExpiresAt || null,
  }];
}

export async function respondToZoneShift(workerUserId, decision, now = new Date()) {
  const action = String(decision || '').toLowerCase();
  if (!['accept', 'decline'].includes(action)) {
    throw new Error('Decision must be either accept or decline');
  }

  const worker = await Worker.findOne({ $or: [{ user: String(workerUserId) }, { userId: String(workerUserId) }] });
  if (!worker) {
    const demoWorker = Array.from(inMemoryWorkers.values()).find((entry) => String(entry.user || entry.userId || entry._id) === String(workerUserId)) || Array.from(inMemoryWorkers.values()).find((entry) => entry.temporaryZone && entry.shiftStatus !== 'DECLINED');
    if (!demoWorker) throw new Error('Worker profile not found');

    const nextZone = demoWorker.temporaryZone || demoWorker.currentZone;
    if (action === 'accept') {
      demoWorker.currentZone = nextZone || demoWorker.currentZone;
      demoWorker.temporaryZone = nextZone || demoWorker.temporaryZone;
      demoWorker.shiftStatus = 'ACTIVE';
      demoWorker.shiftAcceptedAt = now;
      demoWorker.shiftExpiresAt = new Date(now.getTime() + 6 * SHIFT_VALID_DAYS);
      return {
        workerId: String(demoWorker._id || demoWorker.id || demoWorker.user || demoWorker.userId),
        currentZone: demoWorker.currentZone,
        suggestedZone: demoWorker.temporaryZone,
        shiftStatus: 'ACTIVE',
        shiftAcceptedAt: demoWorker.shiftAcceptedAt,
        shiftExpiresAt: demoWorker.shiftExpiresAt,
      };
    }

    demoWorker.shiftStatus = 'DECLINED';
    demoWorker.temporaryZone = null;
    demoWorker.shiftAcceptedAt = null;
    demoWorker.shiftExpiresAt = null;
    return {
      workerId: String(demoWorker._id || demoWorker.id || demoWorker.user || demoWorker.userId),
      currentZone: demoWorker.currentZone,
      suggestedZone: nextZone || null,
      shiftStatus: 'DECLINED',
    };
  }

  const nextStatus = action === 'accept' ? 'ACTIVE' : 'DECLINED';
  const nextZone = worker.temporaryZone || worker.currentZone;

  if (action === 'accept') {
    worker.currentZone = nextZone || worker.currentZone;
    worker.temporaryZone = nextZone || worker.temporaryZone;
    worker.shiftStatus = 'ACTIVE';
    worker.shiftAcceptedAt = now;
    worker.shiftExpiresAt = new Date(now.getTime() + 6 * SHIFT_VALID_DAYS);
    await worker.save();

    if (worker.cooperative) {
      await safelyNotify(() => notifyCooperative(worker.cooperative, {
        type: 'ZONE_SHIFT_ACCEPTED',
        title: 'Worker accepted zone shift',
        message: `${worker.name || 'A worker'} accepted the recommended shift to ${nextZone}.`,
        eventKey: `zone-shift-accepted:${worker._id}:${now.toISOString().slice(0, 10)}`,
      }));
    }

    return {
      workerId: String(worker._id),
      currentZone: worker.currentZone,
      suggestedZone: worker.temporaryZone,
      shiftStatus: 'ACTIVE',
      shiftAcceptedAt: worker.shiftAcceptedAt,
      shiftExpiresAt: worker.shiftExpiresAt,
    };
  }

  worker.shiftStatus = 'DECLINED';
  worker.temporaryZone = null;
  worker.shiftAcceptedAt = null;
  worker.shiftExpiresAt = null;
  await worker.save();

  return {
    workerId: String(worker._id),
    currentZone: worker.currentZone,
    suggestedZone: nextZone || null,
    shiftStatus: 'DECLINED',
  };
}

export async function getCooperativeZoneShiftSuggestions(cooperativeId) {
  if (mongoose.connection.readyState !== 1) return [];
  const workers = await Worker.find({
    cooperative: cooperativeId,
    shiftStatus: 'PENDING',
  }).lean();

  return workers.map((worker) => ({
    workerId: String(worker._id),
    workerName: worker.name || 'Worker',
    currentZone: worker.currentZone || worker.address?.district || worker.location?.address?.district || 'Local',
    suggestedZone: worker.temporaryZone || worker.currentZone || 'Not assigned',
    distanceKm: Number(worker.serviceArea?.radiusKm || worker.location?.workingRadiusKm || 15),
    priority: 'Medium',
    shiftStatus: worker.shiftStatus || 'PENDING',
  }));
}

export async function getAdminZoneShiftRecommendations() {
  if (mongoose.connection.readyState !== 1) {
    const demoWorkers = getDemoZoneShiftWorkers();
    if (demoWorkers.length === 0) return [];
    return demoWorkers.map((worker) => ({
      zone: worker.temporaryZone || worker.currentZone || worker.address?.district || 'Unspecified',
      requiredSkill: worker.experience?.primaryTrade || worker.skills?.[0]?.name || 'General',
      workersNeeded: 1,
      suggestedWorkers: worker.name ? [worker.name] : [],
      priority: normalizeShiftStatus(worker.shiftStatus) === 'ACTIVE' ? 'High' : 'Medium',
      workerId: String(worker._id || worker.id || worker.user || worker.userId),
    }));
  }

  const workers = await Worker.find({
    $or: [{ shiftStatus: 'PENDING' }, { shiftStatus: 'ACTIVE' }, { temporaryZone: { $ne: null } }],
  }).lean();

  if (workers.length === 0) {
    const demoWorkers = getDemoZoneShiftWorkers();
    if (demoWorkers.length === 0) return [];
    return demoWorkers.map((worker) => ({
      zone: worker.temporaryZone || worker.currentZone || worker.address?.district || 'Unspecified',
      requiredSkill: worker.experience?.primaryTrade || worker.skills?.[0]?.name || 'General',
      workersNeeded: 1,
      suggestedWorkers: worker.name ? [worker.name] : [],
      priority: normalizeShiftStatus(worker.shiftStatus) === 'ACTIVE' ? 'High' : 'Medium',
      workerId: String(worker._id || worker.id || worker.user || worker.userId),
    }));
  }

  return workers.map((worker) => ({
    zone: worker.temporaryZone || worker.currentZone || worker.address?.district || 'Unspecified',
    requiredSkill: worker.experience?.primaryTrade || worker.skills?.[0]?.name || 'General',
    workersNeeded: 1,
    suggestedWorkers: worker.name ? [worker.name] : [],
    priority: worker.shiftStatus === 'ACTIVE' ? 'High' : 'Medium',
    workerId: String(worker._id),
  }));
}
