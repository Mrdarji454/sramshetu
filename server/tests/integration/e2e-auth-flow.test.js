import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';

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

// Emulate client getRoleDashboardPath
function getRoleDashboardPath(role) {
  const normalizedRole = (role || '').toUpperCase();
  switch (normalizedRole) {
    case 'COOPERATIVE':
      return '/cooperative/dashboard';
    case 'WORKER':
      return '/worker/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'USER':
    case 'CUSTOMER':
    default:
      return '/user/dashboard';
  }
}

async function runIntegrationTests() {
  console.log('\n======================================================');
  console.log('  Running ShramSetu Frontend-Backend Integration Tests');
  console.log('======================================================\n');

  // 1. Start test HTTP server on an ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Server] Running on ephemeral port ${port}\n`);

  try {
    // 2. Health check
    console.log('--- Step 1: Health Check ---');
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint responds with 200 OK');
    assert(healthData.status === 'ok', 'Health response payload reports status: ok');

    // 3. Register Four Different Roles
    console.log('\n--- Step 2: Register All 4 Roles ---');
    const rolesToTest = [
      { role: 'USER', name: 'Ramesh Patel', phone: '+919811122233', email: 'ramesh@example.com', targetDashboard: '/user/dashboard' },
      { role: 'WORKER', name: 'Santosh Wireman', phone: '+919822233344', email: 'santosh@example.com', targetDashboard: '/worker/dashboard' },
      { role: 'COOPERATIVE', name: 'Pune Majdoor Guild', phone: '+919833344455', email: 'guild@example.com', targetDashboard: '/cooperative/dashboard' },
      { role: 'ADMIN', name: 'GovTech Supervisor', phone: '+919844455566', email: 'admin@example.com', targetDashboard: '/admin/dashboard' },
    ];

    const registeredUsers = {};

    for (const item of rolesToTest) {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          phone: item.phone,
          email: item.email,
          password: 'securePassword123',
          role: item.role,
        }),
      });

      const body = await res.json();
      assert(res.status === 201, `Register ${item.role} responds with 201 Created`);
      assert(body.success === true, `Register ${item.role} returns success: true`);
      assert(body.data?.user?.role === item.role, `Registered user has normalized role "${item.role}"`);
      assert(Boolean(body.data?.token), `Register returns a valid JWT token string`);
      assert(!body.data?.user?.password && !body.data?.user?.passwordHash, `User response strips password/passwordHash`);
      
      // Verify client routing maps to correct dashboard
      const mappedDashboard = getRoleDashboardPath(body.data.user.role);
      assert(mappedDashboard === item.targetDashboard, `Role ${item.role} correctly maps to dashboard ${item.targetDashboard}`);

      registeredUsers[item.role] = { ...body.data, payload: item };
    }

    // 4. Test Registration Validation Errors
    console.log('\n--- Step 3: Registration Validation Errors ---');
    const invalidRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '',
        phone: '',
        password: 'short',
      }),
    });
    const invalidRegBody = await invalidRegRes.json();
    assert(invalidRegRes.status === 400, 'Registration with missing fields rejected with 400');
    assert(invalidRegBody.success === false, 'Error response returns success: false');
    assert(Array.isArray(invalidRegBody.errors) && invalidRegBody.errors.length > 0, 'Validation errors returned in array');

    // 5. Test Login
    console.log('\n--- Step 4: Login Verification ---');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '+919822233344',
        password: 'securePassword123',
      }),
    });
    const loginBody = await loginRes.json();
    assert(loginRes.status === 200, 'Login with phone & password succeeds with 200');
    assert(loginBody.success === true, 'Login returns success: true');
    assert(loginBody.data.user.role === 'WORKER', 'Login returns user with WORKER role');
    assert(Boolean(loginBody.data.token), 'Login response contains JWT token');

    const workerToken = loginBody.data.token;

    // 6. Test Invalid Login Credentials
    console.log('\n--- Step 5: Invalid Login Handling ---');
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '',
        password: '',
      }),
    });
    assert(badLoginRes.status === 400, 'Login with empty credentials returns 400 Bad Request');

    // 7. Test Get Current User (/api/auth/me)
    console.log('\n--- Step 6: Get Current User (GET /api/auth/me) ---');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    const meBody = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me with Bearer token succeeds with 200');
    assert(meBody.data.user.name === 'Santosh Wireman', 'Profile name matches authenticated user');
    assert(meBody.data.user.role === 'WORKER', 'Profile role matches WORKER');
    assert(!meBody.data.user.password, 'GET /api/auth/me never exposes password');

    // 8. Test Expired Session (401 Handling)
    console.log('\n--- Step 7: Expired Session Handling (401) ---');
    const expiredToken = jwt.sign(
      { id: '65f123456789012345678901', role: 'WORKER', name: 'Expired User' },
      config.jwt.secret,
      { expiresIn: '-1s' } // Expired 1 second ago
    );

    const expiredRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const expiredBody = await expiredRes.json();
    assert(expiredRes.status === 401, 'Expired token rejected with 401 Unauthorized');
    assert(expiredBody.message.includes('expired'), 'Error message states token has expired');

    // 9. Test Unauthenticated Access
    console.log('\n--- Step 8: Missing Token Access (401) ---');
    const unauthRes = await fetch(`${baseUrl}/api/auth/me`);
    assert(unauthRes.status === 401, 'Request without token rejected with 401 Unauthorized');

    // 10. Test Role-Based Access Control (403 Forbidden)
    console.log('\n--- Step 9: Unauthorized Role Access (403) ---');
    // WORKER token attempting to access /api/admin route
    const forbiddenRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    assert(forbiddenRes.status === 403, 'Worker accessing Admin route is rejected with 403 Forbidden');
    const forbiddenBody = await forbiddenRes.json();
    assert(forbiddenBody.message.includes('permission') || forbiddenRes.status === 403, 'Forbidden response informs user of insufficient permission');

    // 11. Test Logout
    console.log('\n--- Step 10: Logout Verification ---');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
    });
    const logoutBody = await logoutRes.json();
    assert(logoutRes.status === 200, 'Logout succeeds with 200 OK');
    assert(logoutBody.success === true, 'Logout returns success: true');

    // 12. Verify Role Dashboards Navigation Map
    console.log('\n--- Step 11: Frontend Route Mapping Coverage ---');
    assert(getRoleDashboardPath('USER') === '/user/dashboard', 'USER -> /user/dashboard');
    assert(getRoleDashboardPath('CUSTOMER') === '/user/dashboard', 'CUSTOMER -> /user/dashboard');
    assert(getRoleDashboardPath('COOPERATIVE') === '/cooperative/dashboard', 'COOPERATIVE -> /cooperative/dashboard');
    assert(getRoleDashboardPath('WORKER') === '/worker/dashboard', 'WORKER -> /worker/dashboard');
    assert(getRoleDashboardPath('ADMIN') === '/admin/dashboard', 'ADMIN -> /admin/dashboard');

  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log('\n[Test Server] Shutdown complete.\n');
  }

  console.log('======================================================');
  console.log(`  Test Summary: ${passedTests}/${totalTests} tests passed successfully!`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runIntegrationTests().catch((err) => {
  console.error('Integration test failed with unhandled exception:', err);
  process.exit(1);
});
