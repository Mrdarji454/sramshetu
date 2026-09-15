import http from 'http';
import app from '../../src/app.js';
import { calculateDistance, formatDistance } from '../../src/utils/geo.utils.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runLocationMatchingTests() {
  console.log('\n===============================================================');
  console.log('   Running Location-Based Worker Matching Integration Tests');
  console.log('===============================================================\n');

  // 1. Spin up ephemeral server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Server] Running on ephemeral port ${port}\n`);

  try {
    // -------------------------------------------------------------
    // Unit Check: Haversine Geodesic Math
    // -------------------------------------------------------------
    console.log('--- Step 1: Geodesic Haversine Distance Engine ---');
    // Distance between Kothrud Paud Road (18.5074, 73.8077) and Deccan FC Road (18.5204, 73.8436)
    // Geodesic ground distance is approx 4.0 km
    const distKothrudDeccan = calculateDistance(18.5074, 73.8077, 18.5204, 73.8436);
    assert(distKothrudDeccan > 3.5 && distKothrudDeccan < 4.5, `Kothrud to Deccan calculated distance (~${distKothrudDeccan} km) is within expected range`);
    assert(formatDistance(0.45) === '450 m', 'Sub-kilometer formatting produces meters (450 m)');
    assert(formatDistance(3.84) === '3.8 km', 'Kilometer formatting produces rounded decimal (3.8 km)');

    // -------------------------------------------------------------
    // Test 2: Customer Location in Kothrud - Search All Nearby Workers
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Customer Location (Kothrud) - Query Nearby Workers ---');
    // Kothrud Paud Road: 18.5074, 73.8077
    const kothrudRes = await fetch(`${baseUrl}/api/matching/nearby?lat=18.5074&lng=73.8077&available=true&radius=30`);
    const kothrudData = await kothrudRes.json();

    assert(kothrudRes.status === 200, 'GET /api/matching/nearby responds with 200 OK');
    assert(kothrudData.success === true, 'Response contains success: true');
    assert(Array.isArray(kothrudData.data.workers), 'Response contains workers array');
    assert(Array.isArray(kothrudData.data.cooperatives), 'Response contains cooperatives array');
    assert(kothrudData.data.workers.length > 0, `Discovered ${kothrudData.data.workers.length} nearby qualified workers`);

    // Verify distance sorting: first worker should be closer than subsequent workers
    const firstWorker = kothrudData.data.workers[0];
    const lastWorker = kothrudData.data.workers[kothrudData.data.workers.length - 1];
    assert(firstWorker.distance <= lastWorker.distance, `Ranked nearest worker (${firstWorker.distance} km) before distant worker (${lastWorker.distance} km)`);

    // -------------------------------------------------------------
    // Test 3: Standard Return Payload Verification
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Validate Return Payload Contract ---');
    // Contract: worker, skills, rating, distance, availability, cooperative
    assert(Boolean(firstWorker.worker), 'Match item contains worker object');
    assert(Boolean(firstWorker.worker.id && firstWorker.worker.name), 'Worker object has id and name');
    assert(Array.isArray(firstWorker.skills) && firstWorker.skills.length > 0, 'Match item contains skills array');
    assert(typeof firstWorker.rating === 'number' && firstWorker.rating > 0, 'Match item contains numeric rating');
    assert(typeof firstWorker.distance === 'number', 'Match item contains numeric distance');
    assert(Boolean(firstWorker.distanceFormatted), 'Match item contains formatted distance');
    assert(Boolean(firstWorker.availability && firstWorker.availability.status), 'Match item contains availability object with status');
    assert(Boolean(firstWorker.cooperative && firstWorker.cooperative.name), 'Match item contains cooperative object with name');
    assert(Boolean(firstWorker.coordinates && firstWorker.coordinates.latitude), 'Match item contains geographical coordinates for Leaflet mapping');

    // -------------------------------------------------------------
    // Test 4: Filter by Required Skill / Trade (Plumbing)
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Filter by Required Skill / Service (Plumbing) ---');
    const plumbRes = await fetch(`${baseUrl}/api/matching/nearby?lat=18.5204&lng=73.8567&trade=Plumbing`);
    const plumbData = await plumbRes.json();

    assert(plumbRes.status === 200, 'Search for Plumbing responds with 200');
    assert(plumbData.data.workers.length > 0, 'Plumbing search returns matching workers');
    const allPlumbers = plumbData.data.workers.every((w) =>
      w.worker.primaryTrade.toLowerCase().includes('plumb') ||
      w.worker.trade.toLowerCase().includes('plumb') ||
      w.skills.some((s) => s.toLowerCase().includes('pipe') || s.toLowerCase().includes('pump'))
    );
    assert(allPlumbers, 'All returned candidates possess plumbing trade/skills');

    // -------------------------------------------------------------
    // Test 5: Filter by Availability
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Filter by Availability Status ---');
    // Fetch with availableOnly=true (default)
    const availRes = await fetch(`${baseUrl}/api/matching/nearby?lat=18.5089&lng=73.9259&available=true`);
    const availData = await availRes.json();
    const busyWorkerIncluded = availData.data.workers.some((w) => w.worker.name === 'Mahesh Shinde');
    assert(!busyWorkerIncluded, 'Busy worker (Mahesh Shinde) is excluded when available=true');

    // Fetch with available=false (all workers regardless of status)
    const allAvailRes = await fetch(`${baseUrl}/api/matching/nearby?lat=18.5089&lng=73.9259&available=false`);
    const allAvailData = await allAvailRes.json();
    const busyWorkerPresent = allAvailData.data.workers.some((w) => w.worker.name === 'Mahesh Shinde');
    assert(busyWorkerPresent, 'Busy worker is included when availability filter is disabled (available=false)');

    // -------------------------------------------------------------
    // Test 6: Nearby Cooperatives Endpoint
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Query Nearby Cooperatives ---');
    const coopsRes = await fetch(`${baseUrl}/api/matching/cooperatives?lat=18.5074&lng=73.8077&radius=30`);
    const coopsData = await coopsRes.json();

    assert(coopsRes.status === 200, 'GET /api/matching/cooperatives responds with 200');
    assert(Array.isArray(coopsData.data), 'Returns array of nearby cooperatives');
    assert(coopsData.data.length >= 2, 'Returns both seeded Pune cooperative societies');
    const closestCoop = coopsData.data[0];
    assert(closestCoop.name === 'Maharashtra Karigar Mahasangh', 'Closest cooperative to Kothrud Paud Road is Maharashtra Karigar Mahasangh');
    assert(typeof closestCoop.distance === 'number', 'Cooperative distance is calculated numerically');

    // -------------------------------------------------------------
    // Test 7: POST /api/matching/search Endpoint
    // -------------------------------------------------------------
    console.log('\n--- Step 7: POST /api/matching/search Endpoint ---');
    const postSearchRes = await fetch(`${baseUrl}/api/matching/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 18.5167,
        longitude: 73.8415,
        trade: 'Carpentry',
        availableOnly: true,
        maxRadiusKm: 25,
      }),
    });
    const postSearchData = await postSearchRes.json();

    assert(postSearchRes.status === 200, 'POST /api/matching/search responds with 200 OK');
    assert(postSearchData.data.workers.length > 0, 'POST search returns matching carpentry artisans');
    assert(postSearchData.data.workers[0].worker.name === 'Dattatray Pawar', 'Top carpenter match for Deccan Gymkhana is Dattatray Pawar');

    // -------------------------------------------------------------
    // Test 8: Missing Coordinates Validation Error
    // -------------------------------------------------------------
    console.log('\n--- Step 8: Input Validation for Location ---');
    const invalidRes = await fetch(`${baseUrl}/api/matching/nearby`);
    const invalidData = await invalidRes.json();
    assert(invalidRes.status === 400, 'Missing coordinates rejected with 400 Bad Request');
    assert(invalidData.success === false, 'Error response has success: false');

    console.log(`\n===============================================================`);
    console.log(`  Summary: ${passedTests}/${totalTests} Location Matching Tests Passed!`);
    console.log(`===============================================================\n`);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    server.close();
    console.log('[Test Server] Ephemeral server closed.\n');
  }
}

runLocationMatchingTests();

