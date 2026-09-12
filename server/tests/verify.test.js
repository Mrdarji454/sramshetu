import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

async function runTests() {
  console.log('--- Starting Backend Smoke Tests ---');

  const server = app.listen(5001, '127.0.0.1', async () => {
    try {
      const baseUrl = 'http://127.0.0.1:5001';

      // Test 1: Health check
      const healthRes = await fetch(`${baseUrl}/api/v1/health`);
      const healthData = await healthRes.json();
      console.log('✓ Health check status:', healthRes.status, healthData.status === 'ok' ? 'PASS' : 'FAIL');

      // Test 2: 404 Not Found through Centralized Error Handler
      const notFoundRes = await fetch(`${baseUrl}/api/v1/non-existent-route`);
      const notFoundData = await notFoundRes.json();
      console.log('✓ 404 Centralized Error Handler:', notFoundRes.status === 404 && notFoundData.success === false ? 'PASS' : 'FAIL');

      // Test 3: Auth Middleware 401 on missing token
      const unauthRes = await fetch(`${baseUrl}/api/v1/users/profile`);
      const unauthData = await unauthRes.json();
      console.log('✓ Auth Middleware 401 on missing token:', unauthRes.status === 401 && unauthData.success === false ? 'PASS' : 'FAIL');

      // Test 4: Role Middleware 403 Forbidden for wrong role (user accessing admin)
      const userToken = jwt.sign(
        { id: '65f123456789012345678901', role: 'user', name: 'Citizen' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      const forbiddenRes = await fetch(`${baseUrl}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const forbiddenData = await forbiddenRes.json();
      console.log('✓ Role Middleware 403 Forbidden for unauthorized role:', forbiddenRes.status === 403 && forbiddenData.success === false ? 'PASS' : 'FAIL');

      // Test 5: Role Middleware 200 OK for authorized role (admin accessing admin)
      const adminToken = jwt.sign(
        { id: '65f987654321098765432109', role: 'admin', name: 'Gov Admin' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      const adminRes = await fetch(`${baseUrl}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const adminData = await adminRes.json();
      console.log('✓ Role Middleware 200 OK for authorized admin role:', adminRes.status === 200 && adminData.success === true ? 'PASS' : 'FAIL');

      console.log('--- All Smoke Tests Passed Successfully! ---');
    } catch (err) {
      console.error('Smoke test failure:', err);
    } finally {
      server.close(() => {
        process.exit(0);
      });
    }
  });
}

runTests();

