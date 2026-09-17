import app from '../src/app.js';
import { AiService } from '../src/services/ai.service.js';
import { AiClient } from '../src/integrations/ai-client/aiClient.js';

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`PASS: ${testName}`);
    passed++;
  } else {
    console.error(`FAIL: ${testName}`);
  }
}

// Simple HTTP request helper using Node's native fetch against the Express app
function makeLocalRequest(server, path, method = 'POST', body = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const url = `http://127.0.0.1:${port}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    fetch(url, options)
      .then(async (res) => {
        const json = await res.json();
        resolve({ status: res.status, json });
      })
      .catch(reject);
  });
}

async function runAiWorkloadTests() {
  console.log('--- Starting ShramSetu AI Workload Integration Tests ---\n');

  // Test 1: Operational Data Collection with explicit parameters
  const collectedExplicit = await AiService.collectOperationalData({
    pending_bookings: 25,
    available_workers: 10,
    avg_completion_time: 3.5,
    day_of_week: 'Monday',
  });
  assert(collectedExplicit.pending_bookings === 25, 'Explicit pending_bookings is preserved');
  assert(collectedExplicit.available_workers === 10, 'Explicit available_workers is preserved');
  assert(collectedExplicit.avg_completion_time === 3.5, 'Explicit avg_completion_time is preserved');
  assert(collectedExplicit.day_of_week === 'Monday', 'Explicit day_of_week is preserved');

  // Test 2: Operational Data Collection with empty parameters (automatic aggregation)
  const collectedAuto = await AiService.collectOperationalData({});
  assert(typeof collectedAuto.pending_bookings === 'number' && collectedAuto.pending_bookings >= 0, 'Auto-collected pending_bookings is non-negative');
  assert(typeof collectedAuto.available_workers === 'number' && collectedAuto.available_workers >= 0, 'Auto-collected available_workers is non-negative');
  assert(typeof collectedAuto.avg_completion_time === 'number' && collectedAuto.avg_completion_time > 0, 'Auto-collected avg_completion_time is valid');
  assert(typeof collectedAuto.day_of_week === 'string' && collectedAuto.day_of_week.length > 0, 'Auto-collected day_of_week is a valid string');

  // Test 3: AiService.getWorkloadPrediction returns the 4 required fields
  const prediction = await AiService.getWorkloadPrediction({
    pending_bookings: 25,
    available_workers: 10,
    avg_completion_time: 3.5,
    day_of_week: 'Monday',
  });

  assert(typeof prediction.predictedDemand === 'number', 'predictedDemand is a number');
  assert(typeof prediction.predictedInspections === 'number', 'predictedInspections is a number');
  assert(['Low', 'Moderate', 'High', 'Critical'].includes(prediction.workloadLevel), 'workloadLevel is one of Low, Moderate, High, Critical');
  assert(typeof prediction.priorityScore === 'number' && prediction.priorityScore >= 0 && prediction.priorityScore <= 100, 'priorityScore is between 0 and 100');

  // Test 4: Calibrated reference demand check
  // For 25 bookings, 10 workers, 3.5 hrs on Monday, demand should match the calibrated ~28.45
  assert(Math.abs(prediction.predictedDemand - 28.45) <= 0.10, `predictedDemand (${prediction.predictedDemand}) is calibrated close to 28.45`);

  // Test 5: End-to-End Express API POST /api/ai/workload
  const server = app.listen(0);
  try {
    const res = await makeLocalRequest(server, '/api/ai/workload', 'POST', {
      pending_bookings: 25,
      available_workers: 10,
      avg_completion_time: 3.5,
      day_of_week: 'Monday',
    });

    assert(res.status === 200, 'POST /api/ai/workload returns 200 OK');
    assert(res.json.success === true, 'Response has success: true');
    assert('predictedDemand' in res.json, 'Response JSON contains predictedDemand');
    assert('predictedInspections' in res.json, 'Response JSON contains predictedInspections');
    assert('workloadLevel' in res.json, 'Response JSON contains workloadLevel');
    assert('priorityScore' in res.json, 'Response JSON contains priorityScore');

    // Test 6: Verify versioned route POST /api/v1/ai/workload works equivalently
    const resV1 = await makeLocalRequest(server, '/api/v1/ai/workload', 'POST', {});
    assert(resV1.status === 200, 'POST /api/v1/ai/workload returns 200 OK');
    assert('predictedDemand' in resV1.json, 'Versioned response contains predictedDemand');

    // Test 7: Resilient fallback when AI client points to invalid port
    const badClient = new AiClient('http://127.0.0.1:9999');
    const fallbackRes = await badClient.predictWorkload({
      pending_bookings: 25,
      available_workers: 10,
      avg_completion_time: 3.5,
      day_of_week: 'Monday',
    });
    assert(fallbackRes.fallback === true, 'AiClient falls back gracefully when AI microservice is offline');
    assert(Math.abs(fallbackRes.predictedDemand - 28.45) <= 0.10, 'Fallback calculation accurately uses calibrated formula');

  } finally {
    server.close();
  }

  console.log(`\nAI Workload Test Results: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runAiWorkloadTests().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});

