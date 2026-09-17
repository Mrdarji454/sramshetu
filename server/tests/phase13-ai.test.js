import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { aiService } from '../src/services/aiService.js';

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

// Generate test JWT for role-based authorization tests
function generateTestToken(role = 'ADMIN', userId = '65f123456789012345678999') {
  return jwt.sign(
    {
      id: userId,
      name: `Test ${role}`,
      role: role.toUpperCase(),
      email: `${role.toLowerCase()}@shramsetu.in`,
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

// Helper to make HTTP request to local Express test server
function makeRequest(server, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runPhase13Tests() {
  console.log('--- Starting ShramSetu Phase 13 AI Integration Tests ---\n');

  const server = app.listen(0);
  const adminToken = generateTestToken('ADMIN');
  const coopToken = generateTestToken('COOPERATIVE');
  const workerToken = generateTestToken('WORKER');
  const customerToken = generateTestToken('USER');

  try {
    // 1. Step 7: GET /api/ai/health
    const healthRes = await makeRequest(server, '/api/ai/health', 'GET');
    assert(
      healthRes.status === 200 || healthRes.status === 503,
      'GET /api/ai/health returns valid HTTP status (200 or 503)'
    );
    assert('aiService' in healthRes.json, 'Health response contains "aiService" status indicator');

    // 2. Step 12: Authentication Protection — 401 when no token provided
    const unauthRes = await makeRequest(server, '/api/ai/workload', 'POST', {
      district: 'Ahmedabad',
      serviceType: 'Plumbing',
      applicationsLast7Days: 42,
      applicationsLast30Days: 163,
      pendingApplications: 18,
      availableWorkers: 26,
      averageCompletionTime: 2.5,
    });
    assert(unauthRes.status === 401, 'POST /api/ai/workload without JWT returns 401 Unauthorized');

    // 3. Step 3 & 12: Role Authorization — 403 for WORKER and CUSTOMER
    const workerRes = await makeRequest(
      server,
      '/api/ai/workload',
      'POST',
      {
        district: 'Ahmedabad',
        serviceType: 'Plumbing',
        applicationsLast7Days: 42,
        applicationsLast30Days: 163,
        pendingApplications: 18,
        availableWorkers: 26,
        averageCompletionTime: 2.5,
      },
      workerToken
    );
    assert(workerRes.status === 403, 'POST /api/ai/workload forbidden for WORKER role (403)');

    const customerRes = await makeRequest(
      server,
      '/api/ai/workload',
      'POST',
      {
        district: 'Ahmedabad',
        serviceType: 'Plumbing',
        applicationsLast7Days: 42,
        applicationsLast30Days: 163,
        pendingApplications: 18,
        availableWorkers: 26,
        averageCompletionTime: 2.5,
      },
      customerToken
    );
    assert(customerRes.status === 403, 'POST /api/ai/workload forbidden for USER/CUSTOMER role (403)');

    // 4. Step 4: Request Validation — 400 for invalid/missing inputs
    // Missing district
    const badDistrict = await makeRequest(
      server,
      '/api/ai/workload',
      'POST',
      {
        serviceType: 'Plumbing',
        applicationsLast7Days: 42,
        applicationsLast30Days: 163,
        pendingApplications: 18,
        availableWorkers: 26,
        averageCompletionTime: 2.5,
      },
      adminToken
    );
    assert(badDistrict.status === 400, 'Returns 400 when "district" is missing');

    // Negative workers
    const badWorkers = await makeRequest(
      server,
      '/api/ai/workload',
      'POST',
      {
        district: 'Ahmedabad',
        serviceType: 'Plumbing',
        applicationsLast7Days: 42,
        applicationsLast30Days: 163,
        pendingApplications: 18,
        availableWorkers: -5,
        averageCompletionTime: 2.5,
      },
      adminToken
    );
    assert(badWorkers.status === 400, 'Returns 400 when "availableWorkers" is negative');

    // Zero average completion time
    const badTime = await makeRequest(
      server,
      '/api/ai/workload',
      'POST',
      {
        district: 'Ahmedabad',
        serviceType: 'Plumbing',
        applicationsLast7Days: 42,
        applicationsLast30Days: 163,
        pendingApplications: 18,
        availableWorkers: 26,
        averageCompletionTime: 0,
      },
      adminToken
    );
    assert(badTime.status === 400, 'Returns 400 when "averageCompletionTime" is zero or negative');

    // 5. Step 5 & 13: Data Mapping and Successful Prediction for ADMIN
    // Mock FastAPI response or execute against running instance
    const samplePayload = {
      district: 'Ahmedabad',
      serviceType: 'Plumbing',
      applicationsLast7Days: 42,
      applicationsLast30Days: 163,
      pendingApplications: 18,
      availableWorkers: 26,
      averageCompletionTime: 2.5,
    };

    // Test mapInputToFastApi directly
    const mapped = aiService.mapInputToFastApi(samplePayload);
    assert(mapped.district === 'Ahmedabad', 'Mapped district matches');
    assert(mapped.service_type === 'Plumbing', 'Mapped service_type converted to snake_case');
    assert(mapped.applications_last_7_days === 42, 'Mapped applications_last_7_days matches');
    assert(mapped.applications_last_30_days === 163, 'Mapped applications_last_30_days matches');
    assert(mapped.pending_applications === 18, 'Mapped pending_applications matches');
    assert(mapped.available_workers === 26, 'Mapped available_workers matches');
    assert(mapped.average_completion_time === 2.5, 'Mapped average_completion_time matches');

    // Test predictWorkload end-to-end (mocking axios client call for pure unit test predictability)
    const originalPost = aiService.client.post;
    aiService.client.post = async () => ({
      status: 200,
      data: {
        predictedDemand: 185,
        predictedInspections: 46,
        workloadLevel: 'HIGH',
        priorityScore: 91,
      },
    });

    const adminSuccess = await makeRequest(
      server,
      '/api/ai/workload',
      'POST',
      samplePayload,
      adminToken
    );

    assert(adminSuccess.status === 200, 'POST /api/ai/workload returns 200 OK for ADMIN');
    assert(adminSuccess.json.success === true, 'Response JSON has success: true');
    assert('prediction' in adminSuccess.json, 'Response JSON has "prediction" object');
    assert(typeof adminSuccess.json.prediction.predictedDemand === 'number', 'predictedDemand is numeric');
    assert(typeof adminSuccess.json.prediction.predictedInspections === 'number', 'predictedInspections is numeric');
    assert(adminSuccess.json.prediction.workloadLevel === 'HIGH', 'workloadLevel is HIGH');
    assert(adminSuccess.json.prediction.priorityScore === 91, 'priorityScore is 91');
    assert(typeof adminSuccess.json.recommendation === 'string', 'recommendation generated by Express');

    // 6. Test Access for COOPERATIVE role
    const coopSuccess = await makeRequest(
      server,
      '/api/ai/workload',
      'POST',
      samplePayload,
      coopToken
    );
    assert(coopSuccess.status === 200, 'POST /api/ai/workload returns 200 OK for COOPERATIVE');

    // 7. Step 2 & 6: Timeout / Network Failure Graceful Error Format
    aiService.client.post = async () => {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:8000');
      err.code = 'ECONNREFUSED';
      throw err;
    };

    const failRes = await makeRequest(
      server,
      '/api/ai/workload',
      'POST',
      samplePayload,
      adminToken
    );

    assert(failRes.status === 503, 'Returns 503 when AI service is unavailable');
    assert(failRes.json.success === false, 'Error response has success: false');
    assert(failRes.json.message === 'AI service unavailable', 'Error format matches { success: false, message: "AI service unavailable" }');

    // Restore original axios post
    aiService.client.post = originalPost;

  } finally {
    server.close();
  }

  console.log(`\nPhase 13 AI Integration Tests: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runPhase13Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

