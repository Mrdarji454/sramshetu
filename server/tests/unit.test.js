import jwt from 'jsonwebtoken';
import { AppError } from '../src/utils/AppError.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { authenticate } from '../src/middleware/auth.middleware.js';
import { authorizeRoles } from '../src/middleware/role.middleware.js';
import { config } from '../src/config/env.js';
import { AuthService } from '../src/services/auth.service.js';

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

// 1. Test AppError
const err = new AppError('Resource not found', 404);
assert(err.statusCode === 404, 'AppError has correct statusCode 404');
assert(err.status === 'fail', 'AppError has correct status "fail"');
assert(err.isOperational === true, 'AppError is operational');

// 2. Test asyncHandler
let caughtError = null;
const badFn = asyncHandler(async (req, res, next) => {
  throw new AppError('Something went wrong', 400);
});
badFn({}, {}, (e) => {
  caughtError = e;
});
setTimeout(() => {
  assert(caughtError && caughtError.statusCode === 400, 'asyncHandler passes caught error to next()');

  // 3. Test Centralized errorHandler
  let responseStatusCode = null;
  let responseJson = null;
  const mockRes = {
    status(code) {
      responseStatusCode = code;
      return this;
    },
    json(data) {
      responseJson = data;
      return this;
    },
  };

  errorHandler(new AppError('Unauthorized test', 401), {}, mockRes, () => {});
  assert(responseStatusCode === 401, 'errorHandler returns correct status code');
  assert(responseJson.success === false, 'errorHandler returns success: false');
  assert(responseJson.message === 'Unauthorized test', 'errorHandler preserves error message');

  // 4. Test Role Authorization Middleware
  const roleGuard = authorizeRoles('admin', 'cooperative');

  let roleError = null;
  roleGuard({ user: { role: 'worker' } }, {}, (e) => {
    roleError = e;
  });
  assert(roleError && roleError.statusCode === 403, 'Role middleware returns 403 for unauthorized role');

  let roleAllowed = false;
  roleGuard({ user: { role: 'admin' } }, {}, (e) => {
    if (!e) roleAllowed = true;
  });
  assert(roleAllowed, 'Role middleware allows authorized admin role');

  // 5. Test Auth Middleware (Missing Token)
  let authError = null;
  authenticate({ headers: {} }, {}, (e) => {
    authError = e;
  });
  assert(authError && authError.statusCode === 401, 'Auth middleware returns 401 when token is missing');

  // 6. Test Auth Middleware (Valid Token)
  const token = jwt.sign(
    { id: '65f123456789012345678901', role: 'user', name: 'Ananya' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  let authReq = { headers: { authorization: `Bearer ${token}` } };
  let authSuccess = false;
  authenticate(authReq, {}, (e) => {
    if (!e && authReq.user && authReq.user.role === 'user') {
      authSuccess = true;
    }
  });
  assert(authSuccess, 'Auth middleware successfully verifies valid JWT and populates req.user');

  // 7. Test AuthService Token Generation
  const generatedToken = AuthService.generateToken({
    _id: '65f123456789012345678901',
    role: 'worker',
    name: 'Rajeshwar',
    phone: '+919823144019',
  });
  const decoded = jwt.verify(generatedToken, config.jwt.secret);
  assert(decoded.role === 'worker' && decoded.name === 'Rajeshwar', 'AuthService.generateToken creates valid signed payload');

  console.log(`\n================================`);
  console.log(`Summary: ${passed}/${total} unit tests passed!`);
  console.log(`================================\n`);

  process.exit(passed === total ? 0 : 1);
}, 50);

