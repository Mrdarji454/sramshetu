import jwt from 'jsonwebtoken';
import { AuthService } from '../src/services/auth.service.js';
import { protect, authenticate } from '../src/middleware/auth.middleware.js';
import { authorize, authorizeRoles } from '../src/middleware/role.middleware.js';
import { config } from '../src/config/env.js';
import { AppError } from '../src/utils/AppError.js';
import app from '../src/app.js';

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

async function runAuthTests() {
  console.log('--- Starting ShramSetu Authentication Tests ---\n');

  // 1. Test AuthService Token Generation
  const tokenPayload = {
    id: '65f123456789012345678901',
    name: 'Rajeshwar Shinde',
    phone: '+919820144019',
    role: 'WORKER',
  };
  const token = AuthService.generateToken(tokenPayload);
  assert(typeof token === 'string' && token.length > 20, 'generateToken returns a valid JWT string');
  const decoded = jwt.verify(token, config.jwt.secret);
  assert(decoded.role === 'WORKER' && decoded.name === 'Rajeshwar Shinde', 'Token decoded contains correct role and name');

  // 2. Test Registration (Valid Roles: USER, COOPERATIVE, WORKER, ADMIN)
  const registeredUser = await AuthService.register({
    name: 'Aakash Sharma',
    phone: '+919876543210',
    email: 'aakash@example.com',
    password: 'securePassword123',
    role: 'USER',
  });

  assert(registeredUser && registeredUser.token, 'Register returns an auth token');
  assert(registeredUser.user.role === 'USER', 'Register assigns normalized role USER');
  assert(!registeredUser.user.password && !registeredUser.user.passwordHash, 'Register response NEVER exposes password or passwordHash');

  // Test Worker Registration
  const registeredWorker = await AuthService.register({
    name: 'Santosh Electrician',
    phone: '+919820112233',
    password: 'workerPass123',
    role: 'worker', // lowercase input test
  });
  assert(registeredWorker.user.role === 'WORKER', 'Register normalizes lowercase worker to WORKER');

  // Test Cooperative Registration
  const registeredCoop = await AuthService.register({
    name: 'Pune Shramik Union',
    phone: '+919820199999',
    password: 'coopSecret123',
    role: 'COOPERATIVE',
  });
  assert(registeredCoop.user.role === 'COOPERATIVE', 'Register accepts COOPERATIVE role');

  // Test Admin Registration
  const registeredAdmin = await AuthService.register({
    name: 'Platform Admin',
    phone: '+919999999999',
    password: 'adminSecret123',
    role: 'ADMIN',
  });
  assert(registeredAdmin.user.role === 'ADMIN', 'Register accepts ADMIN role');

  // Test Invalid Role Registration
  let invalidRoleError = null;
  try {
    await AuthService.register({
      name: 'Hacker',
      phone: '+919999900000',
      password: 'badPass123',
      role: 'SUPER_ROOT',
    });
  } catch (err) {
    invalidRoleError = err;
  }
  assert(invalidRoleError && invalidRoleError.statusCode === 400, 'Register rejects unauthorized role with 400 error');

  // 3. Test Login
  const loginResult = await AuthService.login({
    identifier: '+919876543210',
    password: 'securePassword123',
  });
  assert(loginResult && loginResult.token, 'Login returns auth token');
  assert(!loginResult.user.password && !loginResult.user.passwordHash, 'Login response NEVER exposes password or passwordHash');

  let loginMissingError = null;
  try {
    await AuthService.login({ identifier: '', password: '' });
  } catch (err) {
    loginMissingError = err;
  }
  assert(loginMissingError && loginMissingError.statusCode === 400, 'Login requires both identifier and password');

  // 4. Test Protect Middleware
  let missingTokenError = null;
  protect({ headers: {} }, {}, (e) => {
    missingTokenError = e;
  });
  assert(missingTokenError && missingTokenError.statusCode === 401, 'protect middleware rejects request with missing token (401)');

  let malformedTokenError = null;
  protect({ headers: { authorization: 'Bearer invalid.token.value' } }, {}, (e) => {
    malformedTokenError = e;
  });
  assert(malformedTokenError && malformedTokenError.statusCode === 401, 'protect middleware rejects invalid token (401)');

  let validTokenReq = { headers: { authorization: `Bearer ${token}` } };
  let protectSuccess = false;
  protect(validTokenReq, {}, (e) => {
    if (!e && validTokenReq.user && validTokenReq.user.role === 'WORKER') {
      protectSuccess = true;
    }
  });
  assert(protectSuccess, 'protect middleware verifies valid Bearer JWT and attaches user to req.user');
  assert(authenticate === protect, 'authenticate is an exact alias of protect');

  // 5. Test Authorize Middleware
  const adminGuard = authorize('ADMIN');
  let forbiddenError = null;
  adminGuard({ user: { role: 'WORKER' } }, {}, (e) => {
    forbiddenError = e;
  });
  assert(forbiddenError && forbiddenError.statusCode === 403, 'authorize middleware blocks unauthorized role with 403');

  let adminAllowed = false;
  adminGuard({ user: { role: 'ADMIN' } }, {}, (e) => {
    if (!e) adminAllowed = true;
  });
  assert(adminAllowed, 'authorize allows authorized ADMIN');

  // Case-insensitive & multiple roles test
  const coopOrWorkerGuard = authorize('cooperative', 'worker');
  let multiRoleAllowed = false;
  coopOrWorkerGuard({ user: { role: 'COOPERATIVE' } }, {}, (e) => {
    if (!e) multiRoleAllowed = true;
  });
  assert(multiRoleAllowed, 'authorize handles multiple allowed roles and case-insensitive check');

  const userGuard = authorize('USER');
  let userAllowed = false;
  userGuard({ user: { role: 'customer' } }, {}, (e) => {
    if (!e) userAllowed = true;
  });
  assert(userAllowed, 'authorize maps customer and user interchangeably');
  assert(authorizeRoles === authorize, 'authorizeRoles is an exact alias of authorize');

  // 6. Test App Routes Mounted Correctly
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push(middleware.route.path);
    } else if (middleware.name === 'router') {
      // Router middleware
      if (middleware.regexp.test('/api/auth/login')) {
        routes.push('/api');
      }
      if (middleware.regexp.test('/api/v1/auth/login')) {
        routes.push('/api/v1');
      }
    }
  });
  assert(routes.includes('/api'), 'app.js mounts apiRouter on /api');
  assert(routes.includes('/api/v1'), 'app.js mounts apiRouter on /api/v1');

  console.log(`\n================================`);
  console.log(`Summary: ${passed}/${total} auth tests passed!`);
  console.log(`================================\n`);

  process.exit(passed === total ? 0 : 1);
}

runAuthTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

