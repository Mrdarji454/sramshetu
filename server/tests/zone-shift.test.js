import assert from 'node:assert/strict';
import { ZoneDemandSnapshot } from '../src/models/ZoneDemandSnapshot.model.js';
import { buildRecommendations, buildZoneInputs, classifyDemand, distanceKm, ZONE_REFRESH_INTERVAL_MS } from '../src/services/zoneShift.service.js';

assert.equal(classifyDemand({ predictedDemand: 1, availableWorkers: 3 }), 'LOW');
assert.equal(classifyDemand({ predictedDemand: 4, availableWorkers: 3 }), 'MEDIUM');
assert.equal(classifyDemand({ predictedDemand: 5, availableWorkers: 3 }), 'HIGH');
assert.equal(classifyDemand({ predictedDemand: 8, availableWorkers: 3 }), 'CRITICAL');
assert.equal(classifyDemand({ predictedDemand: 2, availableWorkers: 1, fallback: true }), 'HIGH');
assert.equal(ZONE_REFRESH_INTERVAL_MS, 2 * 60 * 60 * 1000);

const puneBookings = [
  { location: { coordinates: [73.85, 18.52], serviceAddress: { city: 'Pune' } }, status: 'PENDING', trade: 'Electrician', createdAt: new Date() },
  { location: { coordinates: [73.86, 18.51], serviceAddress: { city: 'Pune' } }, status: 'PENDING', trade: 'Electrician', createdAt: new Date() },
  { location: { coordinates: [72.93, 22.56], serviceAddress: { city: 'Pune' } }, status: 'PENDING', trade: 'Electrician', createdAt: new Date() },
];
const puneZone = buildZoneInputs(puneBookings, [], new Date()).find(zone => zone.name === 'Pune');
assert.ok(distanceKm(puneZone.coordinates, [73.8567, 18.5204]) < 2,
  'A distant coordinate outlier must not pull the Pune zone center away from its booking cluster');

const worker = {
  _id: '65f123456789012345678902', user: '65f123456789012345678901', cooperative: '65f123456789012345678903',
  name: 'Real Worker', profession: 'Electrician', skills: [{ name: 'Electrician', serviceRadiusKm: 20 }],
  currentZone: 'Surat West', location: { coordinates: [72.80, 21.17], workingRadiusKm: 20 }, availability: { status: 'available' },
};
const target = {
  name: 'Surat Central', coordinates: [72.84, 21.19], profession: 'Electrician', predictedDemand: 6,
  availableWorkers: 1, activeWorkers: 2, pendingBookings: 4, demandSupplyGap: 5, requiredWorkers: 2,
  suggestedIncomingWorkers: 0, demandLevel: 'CRITICAL', priority: 'Critical', source: 'AI',
};
const source = {
  name: 'Surat West', coordinates: [72.80, 21.17], profession: 'Electrician', predictedDemand: 0,
  availableWorkers: 2, activeWorkers: 2, pendingBookings: 0, demandSupplyGap: -2, requiredWorkers: 0,
  suggestedIncomingWorkers: 0, demandLevel: 'LOW', priority: 'Low', source: 'AI',
};
const inputs = [
  { ...target, activeWorkerIds: new Set() },
  { ...source, activeWorkerIds: new Set() },
];
const recommendations = buildRecommendations(inputs, [target, source], [worker], new Date('2026-01-01T00:00:00Z'));
assert.equal(recommendations.length, 1);
assert.equal(recommendations[0].workerName, 'Real Worker');
assert.equal(recommendations[0].suggestedZone, 'Surat Central');
assert.equal(recommendations[0].profession, 'Electrician');
assert.ok(recommendations[0].distance > 0 && recommendations[0].distance < 20);
assert.equal(worker.currentZone, 'Surat West', 'Generating a recommendation must not move the worker');

const acceptedTemporaryShift = { ...worker, _id: '65f123456789012345678904', shiftStatus: 'ACTIVE' };
assert.equal(buildRecommendations(inputs, [{ ...target }, { ...source }], [acceptedTemporaryShift], new Date()).length, 0,
  'A worker already serving a temporary zone must not receive another shift');

const noSurplusSource = { ...source, predictedDemand: source.availableWorkers, demandSupplyGap: 0 };
assert.equal(buildRecommendations(inputs, [{ ...target }, noSurplusSource], [worker], new Date()).length, 0,
  'A source zone must retain workers needed for its own predicted demand');

const busyInputs = [{ ...target, activeWorkerIds: new Set([String(worker._id)]) }, { ...source, activeWorkerIds: new Set([String(worker._id)]) }];
assert.equal(buildRecommendations(busyInputs, [{ ...target }, { ...source }], [worker], new Date()).length, 0);
assert.ok(distanceKm(worker.location.coordinates, target.coordinates) < 20);

const snapshot = new ZoneDemandSnapshot({
  source: 'AI', lastUpdated: new Date(), nextUpdateAt: new Date(Date.now() + ZONE_REFRESH_INTERVAL_MS),
  zones: [{ ...target, bookingsLast7Days: 4, bookingsLast30Days: 8, averageCompletionTime: 2, lastUpdated: new Date() }],
  recommendations,
});
assert.equal(snapshot.validateSync(), undefined);

console.log('PASS: Demand levels map to low, medium, high, and critical thresholds');
console.log('PASS: Suitable idle workers are recommended within skill radius without automatic movement');
console.log('PASS: Active workers are excluded and two-hour AI snapshots validate');
