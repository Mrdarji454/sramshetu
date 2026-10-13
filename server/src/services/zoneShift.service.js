import mongoose from 'mongoose';
import { Booking } from '../models/Booking.model.js';
import { Worker } from '../models/Worker.model.js';
import { ZoneDemandSnapshot } from '../models/ZoneDemandSnapshot.model.js';
import { aiService } from './aiService.js';
import { AppError } from '../utils/AppError.js';
import { notifyAdmins, notifyCooperative, notifyWorker, safelyNotify } from './notification.service.js';

const TWO_HOURS = 2 * 60 * 60 * 1000;
export const ZONE_REFRESH_INTERVAL_MS = TWO_HOURS;
const SHIFT_VALIDITY = 6 * 24 * 60 * 60 * 1000;
const OPEN_STATUSES = new Set(['PENDING', 'ASSIGNED', 'ACCEPTED']);
const ACTIVE_JOB_STATUSES = new Set(['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS']);
let refreshPromise;

const ref = value => String(value?._id || value || '');
const label = value => String(value || '').trim();
const normalized = value => label(value).toLowerCase();
const validCoordinates = value => Array.isArray(value) && value.length === 2 &&
  value.every(item => Number.isFinite(Number(item))) && value.some(item => Number(item) !== 0) &&
  Math.abs(Number(value[0])) <= 180 && Math.abs(Number(value[1])) <= 90;

function bookingZone(booking) {
  const address = booking.location?.serviceAddress || {};
  return label(address.district || address.city);
}

function bookingCoordinates(booking) {
  const coordinates = booking.location?.coordinates || booking.location?.serviceAddress?.coordinates;
  return validCoordinates(coordinates) ? coordinates.map(Number) : null;
}

function workerZone(worker) {
  return label(worker.currentZone || worker.address?.district || worker.address?.city ||
    worker.location?.address?.district || worker.location?.address?.city || worker.serviceArea?.city);
}

function workerCoordinates(worker) {
  const candidates = [worker.liveLocation?.coordinates, worker.location?.coordinates,
  Number.isFinite(Number(worker.address?.longitude)) && Number.isFinite(Number(worker.address?.latitude))
    ? [Number(worker.address.longitude), Number(worker.address.latitude)] : null];
  return candidates.find(validCoordinates)?.map(Number) || null;
}

function workerProfession(worker) {
  return label(worker.profession || worker.customProfession || worker.experience?.primaryTrade || worker.skills?.[0]?.name || 'General');
}

function workerSkills(worker) {
  return [worker.profession, worker.customProfession, worker.experience?.primaryTrade,
  ...(worker.experience?.subTrades || []), ...(worker.skills || []).map(skill => skill.name || skill.skillName)]
    .map(normalized).filter(Boolean);
}

function skillMatches(worker, profession) {
  const target = normalized(profession);
  return workerSkills(worker).some(skill => skill === target || skill.includes(target) || target.includes(skill));
}

export function distanceKm(first, second) {
  if (!validCoordinates(first) || !validCoordinates(second)) return Number.POSITIVE_INFINITY;
  const radians = degrees => degrees * Math.PI / 180;
  const latitudeDelta = radians(second[1] - first[1]);
  const longitudeDelta = radians(second[0] - first[0]);
  const value = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(first[1])) * Math.cos(radians(second[1])) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function classifyDemand({ predictedDemand, availableWorkers, aiLevel, fallback = false }) {
  const gap = Math.round(Number(predictedDemand) - Number(availableWorkers));
  const level = String(aiLevel || '').toUpperCase();
  if (level === 'CRITICAL' || gap >= 3) return 'CRITICAL';
  if (level === 'HIGH' || gap >= (fallback ? 1 : 2)) return 'HIGH';
  if (level === 'MEDIUM' || level === 'MODERATE' || gap > 0) return 'MEDIUM';
  return 'LOW';
}

const priorityFor = level => ({ LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' })[level];

function averageCompletionHours(bookings) {
  const durations = bookings.filter(booking => String(booking.status).toUpperCase() === 'COMPLETED')
    .map(booking => {
      const start = new Date(booking.scheduledTime?.start || booking.createdAt).getTime();
      const completed = booking.statusHistory?.filter(event => String(event.status).toUpperCase() === 'COMPLETED').at(-1)?.timestamp || booking.updatedAt;
      const end = new Date(completed).getTime();
      return Number.isFinite(start) && Number.isFinite(end) && end > start ? (end - start) / 3600000 : null;
    }).filter(value => Number.isFinite(value) && value > 0);
  return durations.length ? Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(2)) : 0;
}

function median(values) {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function centerCoordinates(coordinates) {
  return [
    median(coordinates.map(([longitude]) => longitude)),
    median(coordinates.map(([, latitude]) => latitude)),
  ];
}

export function buildZoneInputs(bookings, workers, now) {
  const zones = new Map();
  const since7 = new Date(now.getTime() - 7 * 86400000);
  const since30 = new Date(now.getTime() - 30 * 86400000);
  const activeWorkerIds = new Set(bookings.filter(booking => ACTIVE_JOB_STATUSES.has(String(booking.status).toUpperCase()))
    .map(booking => ref(booking.worker)).filter(Boolean));
  const ensure = (name, coordinates, recordType) => {
    const key = normalized(name);
    if (!key || !validCoordinates(coordinates)) return null;
    if (!zones.has(key)) zones.set(key, {
      name, coordinates: { bookings: [], workers: [] }, bookings: [], workers: [], professions: new Map(),
    });
    const zone = zones.get(key);
    zone.coordinates[recordType].push(coordinates.map(Number));
    return zone;
  };
  for (const booking of bookings) {
    const zone = ensure(bookingZone(booking), bookingCoordinates(booking), 'bookings');
    if (!zone) continue;
    zone.bookings.push(booking);
    const profession = label(booking.trade || booking.serviceName || 'General');
    zone.professions.set(profession, (zone.professions.get(profession) || 0) + 1);
  }
  for (const worker of workers) {
    const zone = ensure(workerZone(worker), workerCoordinates(worker), 'workers');
    if (zone) zone.workers.push(worker);
  }
  return [...zones.values()].map(zone => {
    const profession = [...zone.professions.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
      workerProfession(zone.workers[0] || {});
    const pendingBookings = zone.bookings.filter(booking => OPEN_STATUSES.has(String(booking.status).toUpperCase())).length;
    const availableWorkers = zone.workers.filter(worker => worker.availability?.status === 'available' && !activeWorkerIds.has(ref(worker._id))).length;
    const activeWorkers = zone.workers.filter(worker => activeWorkerIds.has(ref(worker._id))).length;
    const { coordinates, ...zoneData } = zone;
    return {
      ...zoneData,
      coordinates: centerCoordinates(coordinates.bookings.length ? coordinates.bookings : coordinates.workers),
      profession, pendingBookings, availableWorkers, activeWorkers,
      bookingsLast7Days: zone.bookings.filter(booking => new Date(booking.createdAt) >= since7).length,
      bookingsLast30Days: zone.bookings.filter(booking => new Date(booking.createdAt) >= since30).length,
      averageCompletionTime: averageCompletionHours(zone.bookings), activeWorkerIds,
    };
  });
}

async function predictZone(input, now) {
  let source = 'AI';
  let predictedDemand;
  let aiLevel;
  try {
    if (!input.averageCompletionTime) throw new Error('Insufficient completed-job history');
    const result = await aiService.predictWorkload({
      district: input.name, serviceType: input.profession,
      applicationsLast7Days: input.bookingsLast7Days, applicationsLast30Days: input.bookingsLast30Days,
      pendingApplications: input.pendingBookings, availableWorkers: input.availableWorkers,
      numberOfWorkers: input.activeWorkers, averageCompletionTime: input.averageCompletionTime,
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }),
    });
    predictedDemand = Math.max(0, Math.round(Number(result.predictedDemand) || 0));
    aiLevel = result.workloadLevel;
  } catch {
    source = 'RULE_BASED_FALLBACK';
    predictedDemand = input.pendingBookings;
  }
  const demandSupplyGap = predictedDemand - input.availableWorkers;
  const demandLevel = classifyDemand({ predictedDemand, availableWorkers: input.availableWorkers, aiLevel, fallback: source !== 'AI' });
  return {
    name: input.name, coordinates: input.coordinates, profession: input.profession,
    predictedDemand, availableWorkers: input.availableWorkers, activeWorkers: input.activeWorkers,
    pendingBookings: input.pendingBookings, bookingsLast7Days: input.bookingsLast7Days,
    bookingsLast30Days: input.bookingsLast30Days, averageCompletionTime: input.averageCompletionTime,
    demandSupplyGap, requiredWorkers: Math.max(0, demandSupplyGap), suggestedIncomingWorkers: 0,
    demandLevel, priority: priorityFor(demandLevel), source, lastUpdated: now,
  };
}

export function buildRecommendations(inputs, zones, workers, now) {
  const inputByZone = new Map(inputs.map(input => [normalized(input.name), input]));
  const zoneByName = new Map(zones.map(zone => [normalized(zone.name), zone]));
  const targets = zones.filter(zone => ['HIGH', 'CRITICAL'].includes(zone.demandLevel) && zone.demandSupplyGap > 0);
  const sources = zones.filter(zone => ['LOW', 'MEDIUM'].includes(zone.demandLevel) && zone.availableWorkers > 0 && zone.demandSupplyGap <= 0);
  const sourceCapacity = new Map(sources.map(zone => [
    normalized(zone.name),
    Math.max(0, zone.availableWorkers - Math.max(0, zone.predictedDemand)),
  ]));
  const maxDistance = Math.max(1, Number(process.env.ZONE_SHIFT_MAX_DISTANCE_KM) || 25);
  const recommendations = [];
  const used = new Set();
  for (const target of targets.sort((a, b) => b.demandSupplyGap - a.demandSupplyGap)) {
    const targetInput = inputByZone.get(normalized(target.name));
    let remaining = target.requiredWorkers;
    const candidates = workers.filter(worker => {
      const source = zoneByName.get(normalized(workerZone(worker)));
      const coordinates = workerCoordinates(worker);
      if (!source || !sources.includes(source) || !coordinates || used.has(ref(worker._id))) return false;
      if ((sourceCapacity.get(normalized(source.name)) || 0) <= 0 || worker.shiftStatus === 'ACTIVE') return false;
      if (worker.availability?.status !== 'available' || targetInput.activeWorkerIds.has(ref(worker._id))) return false;
      if (!skillMatches(worker, target.profession)) return false;
      const skillRadius = (worker.skills || []).find(skill => skillMatches({ skills: [skill] }, target.profession))?.serviceRadiusKm;
      const radius = Math.min(maxDistance, Number(skillRadius || worker.location?.workingRadiusKm || worker.serviceArea?.radiusKm || worker.serviceRadius || maxDistance));
      return distanceKm(coordinates, target.coordinates) <= radius;
    }).sort((a, b) => distanceKm(workerCoordinates(a), target.coordinates) - distanceKm(workerCoordinates(b), target.coordinates));
    for (const worker of candidates) {
      if (remaining <= 0) break;
      used.add(ref(worker._id));
      remaining -= 1;
      const sourceZoneName = normalized(workerZone(worker));
      sourceCapacity.set(sourceZoneName, (sourceCapacity.get(sourceZoneName) || 0) - 1);
      const sourceCoordinates = workerCoordinates(worker);
      const distance = Number(distanceKm(sourceCoordinates, target.coordinates).toFixed(1));
      const source = target.source;
      recommendations.push({
        workerId: worker._id, workerUserId: worker.user?._id || worker.user, cooperativeId: worker.cooperative?._id || worker.cooperative || null,
        workerName: worker.name || worker.user?.name || 'Worker', profession: workerProfession(worker),
        currentZone: workerZone(worker), suggestedZone: target.name, sourceCoordinates, targetCoordinates: target.coordinates,
        distance, predictedDemand: target.predictedDemand, availableWorkers: target.availableWorkers,
        demandSupplyGap: target.demandSupplyGap, expectedJobs: Math.max(1, Math.ceil(target.predictedDemand / Math.max(1, target.availableWorkers + target.requiredWorkers))),
        priority: target.priority, reason: `${target.demandLevel} predicted ${target.profession} demand with a ${target.demandSupplyGap}-worker supply gap${source === 'RULE_BASED_FALLBACK' ? ' (Rule-based fallback)' : ''}`,
        source, status: 'PENDING', generatedAt: now,
      });
      target.suggestedIncomingWorkers += 1;
    }
  }
  return recommendations;
}

export async function generateZoneShiftRecommendations(now = new Date()) {
  if (mongoose.connection.readyState !== 1) return [];
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    await clearExpiredZoneShifts(now);
    const since30 = new Date(now.getTime() - 30 * 86400000);
    const [bookings, workers] = await Promise.all([
      Booking.find({ $or: [{ createdAt: { $gte: since30 } }, { status: { $in: ['PENDING', 'pending', 'ASSIGNED', 'assigned', 'ACCEPTED', 'accepted'] } }] }).lean(),
      Worker.find({ $or: [{ 'verificationStatus.status': 'verified' }, { registrationStatus: 'APPROVED' }] }).populate('user', 'name').lean(),
    ]);
    const locatedBookings = bookings.filter(booking => bookingZone(booking) && bookingCoordinates(booking));
    const locatedWorkers = workers.filter(worker => workerZone(worker) && workerCoordinates(worker));
    const inputs = buildZoneInputs(locatedBookings, locatedWorkers, now);
    const zones = await Promise.all(inputs.map(input => predictZone(input, now)));
    const recommendations = buildRecommendations(inputs, zones, locatedWorkers, now);
    const sourceSet = new Set(zones.map(zone => zone.source));
    const source = sourceSet.size > 1 ? 'MIXED' : sourceSet.values().next().value || 'RULE_BASED_FALLBACK';
    await ZoneDemandSnapshot.findOneAndUpdate({ key: 'latest' }, {
      $set: { zones, recommendations, source, lastUpdated: now, nextUpdateAt: new Date(now.getTime() + TWO_HOURS) },
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    for (const recommendation of recommendations) {
      await safelyNotify(() => notifyWorker(recommendation.workerId, {
        type: 'ZONE_SHIFT_OFFER', title: `High demand detected in ${recommendation.suggestedZone}`,
        message: recommendation.reason, eventKey: `zone-shift-offer:${recommendation.workerId}:${now.toISOString()}`,
      }));
      if (recommendation.cooperativeId) await safelyNotify(() => notifyCooperative(recommendation.cooperativeId, {
        type: 'ZONE_SHIFT_RECOMMENDATION', title: 'Zone shift recommendation', message: recommendation.reason,
        eventKey: `zone-shift-coop:${recommendation.workerId}:${now.toISOString()}`,
      }));
    }
    return recommendations;
  })();
  try { return await refreshPromise; } finally { refreshPromise = null; }
}

export async function getLatestZoneIntelligence() {
  if (mongoose.connection.readyState !== 1) return { zones: [], recommendations: [], source: 'RULE_BASED_FALLBACK', lastUpdated: null, nextUpdateAt: null };
  const snapshot = await ZoneDemandSnapshot.findOne({ key: 'latest' }).lean();
  return snapshot || { zones: [], recommendations: [], source: 'RULE_BASED_FALLBACK', lastUpdated: null, nextUpdateAt: null };
}

const publicRecommendation = recommendation => ({
  id: ref(recommendation._id), workerId: ref(recommendation.workerId), workerName: recommendation.workerName,
  profession: recommendation.profession, currentZone: recommendation.currentZone, suggestedZone: recommendation.suggestedZone,
  distance: recommendation.distance, distanceKm: recommendation.distance, predictedDemand: recommendation.predictedDemand,
  availableWorkers: recommendation.availableWorkers, demandSupplyGap: recommendation.demandSupplyGap,
  expectedJobs: recommendation.expectedJobs, expectedExtraJobs: recommendation.expectedJobs,
  priority: recommendation.priority, reason: recommendation.reason, source: recommendation.source,
  status: recommendation.status, generatedAt: recommendation.generatedAt,
  sourceCoordinates: recommendation.sourceCoordinates, targetCoordinates: recommendation.targetCoordinates,
});

export async function getPendingZoneShiftOffers(workerUserId) {
  const snapshot = await getLatestZoneIntelligence();
  return snapshot.recommendations.filter(item => ref(item.workerUserId) === ref(workerUserId) && item.status === 'PENDING').map(publicRecommendation);
}

export async function respondToZoneShift(workerUserId, decision, now = new Date()) {
  const action = String(decision || '').toLowerCase();
  if (!['accept', 'decline'].includes(action)) throw new AppError('Decision must be either accept or decline', 400);
  const worker = await Worker.findOne({ user: workerUserId });
  if (!worker) throw new AppError('Worker profile not found', 404);
  const snapshot = await ZoneDemandSnapshot.findOne({ key: 'latest', recommendations: { $elemMatch: { workerUserId: workerUserId, status: 'PENDING' } } });
  if (!snapshot) throw new AppError('No pending zone shift recommendation was found', 409);
  const recommendation = snapshot.recommendations.find(item => ref(item.workerUserId) === ref(workerUserId) && item.status === 'PENDING');
  recommendation.status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
  recommendation.respondedAt = now;
  await snapshot.save();
  if (action === 'accept') {
    worker.temporaryZone = recommendation.suggestedZone;
    worker.shiftStatus = 'ACTIVE';
    worker.shiftAcceptedAt = now;
    worker.shiftExpiresAt = new Date(now.getTime() + SHIFT_VALIDITY);
  } else {
    worker.shiftStatus = 'DECLINED';
    worker.temporaryZone = null;
    worker.shiftAcceptedAt = null;
    worker.shiftExpiresAt = null;
  }
  await worker.save();
  return { ...publicRecommendation(recommendation), shiftStatus: worker.shiftStatus, temporaryZone: worker.temporaryZone };
}

export async function clearExpiredZoneShifts(now = new Date()) {
  const result = await Worker.updateMany({ shiftStatus: 'ACTIVE', shiftExpiresAt: { $lt: now } }, {
    $set: { shiftStatus: 'EXPIRED', temporaryZone: null, shiftAcceptedAt: null, shiftExpiresAt: null },
  });
  return result.modifiedCount || 0;
}

export async function getCooperativeZoneShiftSuggestions(cooperativeId) {
  const snapshot = await getLatestZoneIntelligence();
  return {
    lastUpdated: snapshot.lastUpdated, source: snapshot.source,
    recommendations: snapshot.recommendations.filter(item => ref(item.cooperativeId) === ref(cooperativeId) && item.status === 'PENDING').map(publicRecommendation),
  };
}

export async function getAdminZoneShiftRecommendations() {
  const snapshot = await getLatestZoneIntelligence();
  const zones = snapshot.zones.map(zone => ({ ...zone, id: normalized(zone.name), latitude: zone.coordinates[1], longitude: zone.coordinates[0], activityLevel: zone.demandLevel.toLowerCase() }));
  return {
    lastUpdated: snapshot.lastUpdated, nextUpdateAt: snapshot.nextUpdateAt, source: snapshot.source, zones,
    recommendations: snapshot.recommendations.filter(item => item.status === 'PENDING').map(publicRecommendation),
    summary: {
      highDemandZones: zones.filter(zone => ['HIGH', 'CRITICAL'].includes(zone.demandLevel)).length,
      workerShortageZones: zones.filter(zone => zone.demandSupplyGap > 0).length,
      oversupplyZones: zones.filter(zone => zone.demandSupplyGap <= 0 && zone.availableWorkers > 0).length,
      recommendedShifts: snapshot.recommendations.filter(item => item.status === 'PENDING').length,
    },
  };
}

export async function recommendShiftToWorker(workerId, cooperativeId, allowAll = false) {
  const worker = await Worker.findById(workerId);
  if (!worker || (!allowAll && ref(worker.cooperative) !== ref(cooperativeId))) throw new AppError('Worker does not belong to this cooperative', 403);
  const snapshot = await ZoneDemandSnapshot.findOne({ key: 'latest', recommendations: { $elemMatch: { workerId, status: 'PENDING' } } });
  if (!snapshot) throw new AppError('No pending recommendation exists for this worker', 404);
  const recommendation = snapshot.recommendations.find(item => ref(item.workerId) === ref(workerId) && item.status === 'PENDING');
  await safelyNotify(() => notifyWorker(workerId, { type: 'ZONE_SHIFT_OFFER', title: `High demand detected in ${recommendation.suggestedZone}`, message: recommendation.reason }));
  return publicRecommendation(recommendation);
}
