import assert from 'node:assert/strict';
import { BookingService, inMemoryBookings } from '../src/services/booking.service.js';
import { issueWorkOtp, verifyWorkOtp, publicBooking } from '../src/services/bookingVerification.service.js';
import { submitReview } from '../src/services/review.service.js';
import { MatchingService } from '../src/services/matching.service.js';
import { CooperativeService } from '../src/services/cooperative.service.js';
import { rankWithAiFallback, manualRank } from '../src/services/smartMatching.service.js';
import { inMemoryWorkers } from '../src/services/worker.service.js';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

const customer = '65f123456789012345678901', worker = '65f123456789012345678902', coop = '65f123456789012345678903';
let passed = 0;
async function test(name, action) { await action(); passed++; console.log(`PASS: ${name}`); }
await test('Cooperative roster contains only its linked workers and includes live profile fields', async () => {
  const firstRoster = await CooperativeService.getMembers('65f123456789012345678903');
  const secondRoster = await CooperativeService.getMembers('65f123456789012345678904');
  assert(firstRoster.length > 0);
  assert(secondRoster.length > 0);
  assert(firstRoster.every(member => Array.isArray(member.coordinates) && member.coordinates.length === 2));
  assert(firstRoster.every(member => member.profileImage !== undefined && member.lastUpdated !== undefined));
  assert(!firstRoster.some(member => secondRoster.some(other => other.id === member.id)));
});
const booking = await BookingService.createBooking(customer, {
  serviceName: 'Electrical', trade: 'Electrical', workerId: worker, cooperativeId: coop,
  location: { coordinates: [73.8058, 18.5074], serviceAddress: { street: 'Test Street', city: 'Pune' } },
  scheduledTime: { start: new Date(Date.now() + 86400000) },
});
const id = String(booking._id);
await test('Booking details deny unrelated customers and workers', async () => {
  await assert.rejects(() => BookingService.getBookingById(id, '65f123456789012345678999', 'USER'), { statusCode: 403 });
  await assert.rejects(() => BookingService.acceptBooking(id, '65f123456789012345678999'), { statusCode: 403 });
});
await BookingService.acceptBooking(id, worker);
await BookingService.updateBookingStatus(id, 'ON_THE_WAY', worker, 'WORKER');
await test('Direct status updates cannot bypass OTP', async () => {
  await assert.rejects(() => BookingService.updateBookingStatus(id, 'IN_PROGRESS', worker, 'WORKER'), { statusCode: 403 });
});
const start = await issueWorkOtp(id, 'start', customer, 'USER');
await test('Six-digit codes are salted, hashed, private and throttled', async () => {
  assert.match(start.code, /^\d{6}$/);
  assert.notEqual(booking.startOTP.hash, start.code);
  assert.equal(publicBooking(booking).startOTP, undefined);
  assert.equal(publicBooking(booking).qrVerification.otpCode, undefined);
  await assert.rejects(() => issueWorkOtp(id, 'start', customer, 'USER'), { statusCode: 429 });
  await assert.rejects(() => issueWorkOtp(id, 'start', worker, 'WORKER'), { statusCode: 403 });
});
await test('Customer cannot self-verify their code', async () => {
  await assert.rejects(() => verifyWorkOtp(id, 'start', start.code, customer, 'USER'), { statusCode: 403 });
});
await test('Wrong and expired codes do not advance booking', async () => {
  const wrong = start.code === '000000' ? '111111' : '000000';
  await assert.rejects(() => verifyWorkOtp(id, 'start', wrong, worker, 'WORKER'), { statusCode: 400 });
  assert.equal(booking.startOTP.attempts, 1);
  booking.startOTP.expiresAt = new Date(Date.now() - 1000);
  await assert.rejects(() => verifyWorkOtp(id, 'start', start.code, worker, 'WORKER'), { statusCode: 409 });
  booking.startOTP.expiresAt = new Date(Date.now() + 600000);
});
await test('Five failed attempts lock the code', async () => {
  for (let n = 1; n < 5; n++) await assert.rejects(() => verifyWorkOtp(id, 'start', '000000', worker, 'WORKER'), { statusCode: 400 });
  await assert.rejects(() => verifyWorkOtp(id, 'start', start.code, worker, 'WORKER'), { statusCode: 409 });
  booking.startOTP.issuedAt = new Date(Date.now() - 31000);
});
const replacement = await issueWorkOtp(id, 'start', customer, 'USER');
await test('One-time start code advances exactly once under concurrent requests', async () => {
  const results = await Promise.allSettled([verifyWorkOtp(id, 'start', replacement.code, worker, 'WORKER'), verifyWorkOtp(id, 'start', replacement.code, worker, 'WORKER')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(booking.status, 'IN_PROGRESS');
  assert.equal(booking.statusHistory.filter(e => e.status === 'IN_PROGRESS').length, 1);
});
await test('Premature reviews are rejected', async () => {
  await assert.rejects(() => submitReview(id, customer, { rating: 5 }), { statusCode: 409 });
});
booking.paymentStatus = 'escrow_locked';
const end = await issueWorkOtp(id, 'end', customer, 'USER');
await test('Independent completion code settles held escrow and cannot be reused', async () => {
  assert.notEqual(booking.endOTP.salt, booking.startOTP.salt);
  const completed = await verifyWorkOtp(id, 'end', end.code, worker, 'WORKER');
  assert.equal(completed.status, 'COMPLETED');
  assert.equal(completed.paymentStatus, 'released');
  await assert.rejects(() => verifyWorkOtp(id, 'end', end.code, worker, 'WORKER'), { statusCode: 409 });
  const reloaded = await BookingService.getBookingById(id, customer, 'USER');
  assert.equal(reloaded.status, 'COMPLETED');
});
await test('Worker and cooperative ratings stay separate; duplicate and invalid reviews rejected', async () => {
  await assert.rejects(() => submitReview(id, customer, { rating: 6 }), { statusCode: 400 });
  await submitReview(id, customer, { rating: 5, cooperativeRating: 3, feedback: 'Good work', tags: ['Skilled'] });
  await assert.rejects(() => submitReview(id, customer, { rating: 1 }), { statusCode: 409 });
  assert.equal(inMemoryWorkers.get(worker).rating.average, 5);
  const { inMemoryCooperatives } = await import('../src/services/cooperative.service.js');
  assert.equal([...inMemoryCooperatives.values()].find(c => String(c._id || c.id) === coop).rating.average, 3);
});
await test('Custom profession and cooperative category filtering work', async () => {
  const customId = '65f123456789012345678888';
  inMemoryWorkers.set(customId, { ...inMemoryWorkers.get(worker), id: customId, _id: customId, trade: 'Solar Panel Cleaning', experience: { primaryTrade: 'Solar Panel Cleaning' }, skills: [{ name: 'Solar Panel Cleaning' }] });
  const matches = await MatchingService.findNearbyMatches({ latitude: 18.5074, longitude: 73.8058, query: 'Solar Panel Cleaning', sortBy: 'rating' });
  assert.equal(matches.workers.length, 1);
  assert.equal(String(matches.workers[0].worker.id), customId);
  assert(matches.cooperatives.every(c => c.serviceCategories.some(s => s.toLowerCase().includes('solar panel cleaning'))));
  inMemoryWorkers.delete(customId);
  const electricians = await MatchingService.findNearbyMatches({ latitude: 18.5074, longitude: 73.8058, query: 'Electrician', sortBy: 'rating' });
  assert(electricians.workers.length > 0);
});
const candidates = [
  { worker: { id: 'a', primaryTrade: 'Plumber' }, exactProfession: false, skillMatch: true, distance: 1, rating: 5, skills: [], availability: { status: 'available' } },
  { worker: { id: 'b', primaryTrade: 'Electrician' }, exactProfession: true, skillMatch: false, distance: 9, rating: 4, skills: [], availability: { status: 'available' } },
];
await test('Manual ranking prioritizes exact profession before proximity', async () => {
  assert.equal([...candidates].sort(manualRank)[0].worker.id, 'b');
});
await test('AI success, outages and malformed responses all preserve eligible results', async () => {
  const success = await rankWithAiFallback(candidates, {}, { post: async () => ({ data: { rankedWorkerIds: ['a', 'b'] } }) });
  assert.equal(success.rankingEngine, 'ai');
  for (const client of [{ post: async () => { throw new Error('Unavailable'); } }, { post: async () => ({ data: { rankedWorkerIds: ['intruder'] } }) }]) {
    const result = await rankWithAiFallback(candidates, {}, client);
    assert.equal(result.rankingEngine, 'manual');
    assert.deepEqual(result.workers.map(w => w.worker.id), ['b', 'a']);
  }
});
await test('HTTP routes expose public profiles, enforce booking auth, and hide OTP secrets', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const token = jwt.sign({ id: customer, role: 'USER' }, config.jwt.secret);
    const headers = { Authorization: `Bearer ${token}` };
    for (const path of [`/workers/public/${worker}`, `/cooperatives/public/${coop}`]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert(body.data.name);
      assert.equal(body.data.payoutDetails, undefined);
      assert.equal(body.data.phone, undefined);
    }
    assert.equal((await fetch(`${base}/bookings/${id}`)).status, 401);
    const response = await fetch(`${base}/bookings/${id}`, { headers });
    assert.equal(response.status, 200);
    const data = (await response.json()).data;
    assert.equal(data.status, 'COMPLETED');
    assert.equal(data.startOTP, undefined);
    assert.equal(data.endOTP, undefined);
    assert.equal((await fetch(`${base}/reviews/booking/${id}`, { headers })).status, 200);
    const search = await fetch(`${base}/matching/nearby?lat=18.5074&lng=73.8058&query=Electrician&sort=score`);
    assert.equal(search.status, 200);
    assert((await search.json()).data.workers.length > 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
inMemoryBookings.delete(id);
inMemoryBookings.delete(booking.id);
console.log(`User portal: ${passed} tests passed`);
