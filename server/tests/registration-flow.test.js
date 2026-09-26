import http from 'http';
import app from '../src/app.js';
import { AuthService } from '../src/services/auth.service.js';
import { OtpService } from '../src/services/otp.service.js';
import { PincodeService } from '../src/services/pincode.service.js';
import { WorkerService } from '../src/services/worker.service.js';
import { AdminService } from '../src/services/admin.service.js';

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

async function runRegistrationFlowTests() {
  console.log('--- Starting ShramSetu Registration & Onboarding E2E Tests ---\n');

  // ==========================================
  // REQUIREMENT 1: Mobile OTP Verification
  // ==========================================
  const testPhone = '+919988776655';
  const otpResult = await OtpService.sendOtp(testPhone);
  assert(otpResult.success && /^\d{6}$/.test(otpResult.debugOtp), 'R1: Generates 6-digit mobile OTP');
  assert(!OtpService.isPhoneVerified(testPhone), 'R1: Phone is initially not verified');

  // Verify with invalid OTP
  let badVerifyError = null;
  try {
    await OtpService.verifyOtp(testPhone, '000000');
  } catch (err) {
    badVerifyError = err;
  }
  assert(badVerifyError?.statusCode === 400, 'R1: Rejects incorrect OTP');

  // Verify with valid OTP
  const goodVerify = await OtpService.verifyOtp(testPhone, otpResult.debugOtp);
  assert(goodVerify.success && goodVerify.verified, 'R1: Successfully verifies correct OTP');
  assert(OtpService.isPhoneVerified(testPhone), 'R1: Marks phone as verified');

  // ==========================================
  // REQUIREMENT 2: Compulsory Email in Registration
  // ==========================================
  let emailMissingError = null;
  try {
    await AuthService.register({
      name: 'Ramesh Carpenter',
      phone: '+919988776656',
      email: '',
      password: 'password123',
      role: 'WORKER',
      phoneVerified: true,
    });
  } catch (err) {
    emailMissingError = err;
  }
  assert(emailMissingError !== null && emailMissingError.statusCode === 400, 'R2: Fails registration when email is empty');

  let badEmailError = null;
  try {
    await AuthService.register({
      name: 'Ramesh Carpenter',
      phone: '+919988776656',
      email: 'not-a-valid-email',
      password: 'password123',
      role: 'WORKER',
      phoneVerified: true,
    });
  } catch (err) {
    badEmailError = err;
  }
  assert(badEmailError !== null && badEmailError.statusCode === 400, 'R2: Fails registration on invalid email format');

  // Successfully register worker with valid email & verified phone
  const registeredWorker = await AuthService.register({
    name: 'Ramesh Carpenter',
    phone: testPhone,
    email: 'ramesh.carpenter@example.com',
    password: 'password123',
    role: 'WORKER',
    phoneVerified: true,
  });
  const workerUserId = registeredWorker.user.id;
  assert(registeredWorker.user.email === 'ramesh.carpenter@example.com', 'R2: Compulsory email stored correctly');
  assert(registeredWorker.user.phoneVerified === true, 'R1: Phone verification state recorded on User');

  // Verify Worker profile was initialized in DRAFT mode
  const initialStatus = await WorkerService.getRegistrationStatus(workerUserId);
  assert(initialStatus.registrationStatus === 'DRAFT', 'R10/R11: Worker profile initialized in DRAFT mode');
  assert(initialStatus.isLocked === false, 'R10: Registration form is not locked in DRAFT mode');

  // ==========================================
  // REQUIREMENT 3: Indian Pincode & Reverse Geocoding
  // ==========================================
  const pincodeData = await PincodeService.lookup('411001');
  assert(pincodeData.pincode === '411001', 'R3: Pincode lookup returns matching pincode');
  assert(Boolean(pincodeData.state && pincodeData.district), 'R3: Pincode lookup returns state and district');

  let invalidPincodeError = null;
  try {
    await PincodeService.lookup('01234');
  } catch (err) {
    invalidPincodeError = err;
  }
  assert(invalidPincodeError !== null, 'R3: Rejects invalid pincode format');

  const geocodeData = await PincodeService.reverseGeocode(18.5204, 73.8567);
  assert(geocodeData.latitude === 18.5204 && geocodeData.longitude === 73.8567, 'R3: Reverse geocoding handles coordinates');

  // ==========================================
  // REQUIREMENT 4: Predefined & Custom Profession (Step 1)
  // ==========================================
  const step1Result = await WorkerService.saveStep(workerUserId, 1, {
    name: 'Ramesh Carpenter',
    email: 'ramesh.carpenter@example.com',
    phone: testPhone,
  });
  assert(step1Result.name === 'Ramesh Carpenter', 'R1: Step 1 saves worker identity');
  assert(step1Result.maxCompletedStep >= 1, 'R11: Step 1 advances maxCompletedStep to 1');

  // ==========================================
  // REQUIREMENT 11: No Step Jumping
  // ==========================================
  let jumpError = null;
  try {
    // Attempt to jump directly to Step 3 without completing Step 2
    await WorkerService.saveStep(workerUserId, 3, {
      skills: [{ skillName: 'Wood Carving', experienceYears: 5, serviceRadiusKm: 20 }],
    });
  } catch (err) {
    jumpError = err;
  }
  assert(jumpError !== null && jumpError.statusCode === 400, 'R11: Prevents skipping to Step 3 before completing Step 2');

  // ==========================================
  // REQUIREMENT 1: Phone verification (Step 2)
  // ==========================================
  const step2Result = await WorkerService.saveStep(workerUserId, 2, {
    phoneVerified: true,
    phone: testPhone,
  });
  assert(step2Result.phoneVerified === true, 'R1: Step 2 saves verified phone state');
  assert(step2Result.maxCompletedStep >= 2, 'R11: Step 2 advances maxCompletedStep to 2');

  // ==========================================
  // REQUIREMENT 5: Cooperative affiliation is optional (Step 3)
  // ==========================================
  const step3Result = await WorkerService.saveStep(workerUserId, 3, {
    bio: 'Experienced heritage furniture restorer',
    cooperativeId: null,
  });
  assert(step3Result.cooperative === null, 'R5: Step 3 allows independent workers without a cooperative');
  assert(step3Result.maxCompletedStep >= 3, 'R11: Step 3 advances maxCompletedStep to 3');

  // ==========================================
  // REQUIREMENT 3: Worker Address (Step 4)
  // ==========================================
  const step4Result = await WorkerService.saveStep(workerUserId, 4, {
    address: {
      pincode: '411001',
      district: pincodeData.district,
      state: pincodeData.state,
      city: 'Pune',
      line1: 'Shop 14, Bajirao Road',
      latitude: 18.5204,
      longitude: 73.8567,
    },
  });
  assert(step4Result.address.pincode === '411001', 'R3: Step 4 saves validated pincode');
  assert(step4Result.address.district === pincodeData.district, 'R3: Step 4 saves autofilled district');
  assert(step4Result.maxCompletedStep >= 4, 'R11: Step 4 advances maxCompletedStep to 4');

  // ==========================================
  // REQUIREMENT 4: Profession (Step 5)
  // ==========================================
  const step5Result = await WorkerService.saveStep(workerUserId, 5, {
    profession: 'Other',
    customProfession: 'Heritage Furniture Restorer',
  });
  assert(step5Result.profession === 'Other', 'R4: Step 5 saves profession');
  assert(step5Result.customProfession === 'Heritage Furniture Restorer', 'R4: Step 5 saves custom profession');
  assert(step5Result.maxCompletedStep >= 5, 'R11: Step 5 advances maxCompletedStep to 5');

  // ==========================================
  // REQUIREMENT 6 & 7: Skills with Experience & Radius (Step 6)
  // ==========================================
  const step6Result = await WorkerService.saveStep(workerUserId, 6, {
    skills: [
      {
        skillName: 'Wood Carving',
        category: 'Carpentry',
        experienceYears: 7,
        serviceRadiusKm: 25,
        isPrimary: true,
      },
      {
        skillName: 'French Polish',
        category: 'Finishing',
        experienceYears: 4,
        serviceRadiusKm: 15,
        isPrimary: false,
      },
    ],
  });
  assert(step6Result.skills.length === 2, 'R6: Step 6 saves multiple skills');
  assert(step6Result.skills[0].experienceYears === 7, 'R7: Skill 1 stores distinct experience years (7 yrs)');
  assert(step6Result.skills[0].serviceRadiusKm === 25, 'R7: Skill 1 stores distinct service radius (25 km)');
  assert(step6Result.skills[1].serviceRadiusKm === 15, 'R7: Skill 2 stores distinct service radius (15 km)');
  assert(step6Result.maxCompletedStep >= 6, 'R11: Step 6 advances maxCompletedStep to 6');

  // ==========================================
  // REQUIREMENT 8 & 9: Documents (Step 7)
  // - Aadhaar
  // - Address Proof
  // - e-Shram Card (REQUIRED)
  // - Police Verification completely removed
  // ==========================================
  let policeError = null;
  try {
    await WorkerService.saveStep(workerUserId, 7, {
      policeVerification: 'cleared',
    });
  } catch (err) {
    policeError = err;
  }
  assert(policeError !== null && policeError.statusCode === 400, 'R9: Completely blocks police verification in document flow');

  // Upload without e-Shram card initially
  await WorkerService.saveStep(workerUserId, 7, {
    aadhaar: { url: 'https://example.com/aadhaar.pdf', name: 'Aadhaar.pdf' },
    addressProof: { docType: 'Electricity Bill', url: 'https://example.com/ebill.pdf', name: 'Bill.pdf' },
  });

  // Attempt final submission without e-Shram card -> MUST FAIL
  let missingEshramError = null;
  try {
    await WorkerService.submitRegistration(workerUserId);
  } catch (err) {
    missingEshramError = err;
  }
  assert(
    missingEshramError !== null && missingEshramError.message.includes('eshram.gov.in'),
    'R8: Submitting without e-Shram card is rejected and returns official registration URL link'
  );

  // Now upload mandatory e-Shram card
  const step7Complete = await WorkerService.saveStep(workerUserId, 7, {
    aadhaar: { url: 'https://example.com/aadhaar.pdf', name: 'Aadhaar.pdf' },
    addressProof: { docType: 'Electricity Bill', url: 'https://example.com/ebill.pdf', name: 'Bill.pdf' },
    eshramCard: { url: 'https://example.com/eshram.pdf', name: 'eshram.pdf' },
  });
  assert(step7Complete.eshramProvided === true, 'R8: Records e-Shram card provision');

  // ==========================================
  // REQUIREMENT 10: Final Submission & Locking Flow
  // ==========================================
  const submission = await WorkerService.submitRegistration(workerUserId);
  assert(submission.success === true, 'R10: Final submission succeeds when all requirements met');
  assert(submission.registrationStatus === 'PENDING_APPROVAL', 'R10: Status transitions to PENDING_APPROVAL');

  const pendingStatus = await WorkerService.getRegistrationStatus(workerUserId);
  assert(pendingStatus.isLocked === true, 'R10: Form is locked from editing after submission');

  // Attempting to modify steps after submission must be rejected
  let lockedEditError = null;
  try {
    await WorkerService.saveStep(workerUserId, 1, { name: 'Attempted Modification' });
  } catch (err) {
    lockedEditError = err;
  }
  assert(lockedEditError !== null && lockedEditError.statusCode === 403, 'R10: Locked from editing steps while in PENDING_APPROVAL');

  // Attempting to re-submit must be rejected
  let duplicateSubmitError = null;
  try {
    await WorkerService.submitRegistration(workerUserId);
  } catch (err) {
    duplicateSubmitError = err;
  }
  assert(duplicateSubmitError !== null && duplicateSubmitError.statusCode === 400, 'R10: Prevents duplicate submissions');

  // ==========================================
  // Admin Review: Approval & Rejection Testing
  // ==========================================
  // 1. Admin views verification request
  const requests = await AdminService.getVerificationRequests({ type: 'worker' });
  const workerReq = requests.find((r) => r.userId === workerUserId || r.applicantId === workerUserId);
  assert(Boolean(workerReq), 'Admin: Worker appears in verification requests');
  assert(workerReq.eshramProvided === true, 'Admin: Shows e-Shram card status');
  assert(workerReq.cooperativeName === 'Independent / None', 'Admin: Correctly displays Independent / None when cooperative omitted');
  assert(workerReq.skills.length === 2 && workerReq.skills[0].serviceRadiusKm === 25, 'Admin: Preserves per-skill radius');

  // 2. Admin Rejection with remarks
  const rejectResult = await AdminService.reviewVerification({
    applicantType: 'worker',
    applicantId: workerUserId,
    status: 'rejected',
    remarks: 'Aadhaar copy is blurry, please re-upload clear scan.',
  });
  assert(rejectResult.status === 'rejected', 'Admin: Rejects worker application');
  assert(rejectResult.registrationStatus === 'REJECTED', 'Admin: Sets registrationStatus to REJECTED');

  const rejectedStatus = await WorkerService.getRegistrationStatus(workerUserId);
  assert(rejectedStatus.registrationStatus === 'REJECTED', 'Worker: Shows REJECTED registrationStatus');
  assert(rejectedStatus.rejectionReason.includes('blurry'), 'Worker: Receives administrator remarks');

  // 3. Admin Approval
  const approveResult = await AdminService.reviewVerification({
    applicantType: 'worker',
    applicantId: workerUserId,
    status: 'verified',
  });
  assert(approveResult.status === 'verified', 'Admin: Approves worker application');
  assert(approveResult.registrationStatus === 'APPROVED', 'Admin: Sets registrationStatus to APPROVED');

  // ==========================================
  // HTTP Endpoint Mount & Dispatch Verification (/api and /api/v1)
  // ==========================================
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  const makeReq = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const port = server.address().port;
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, json: data ? JSON.parse(data) : {} });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  };

  const routeOtpPhone = '+919988776698';
  const sendOtpHttpRes = await makeReq('/api/auth/otp/send', 'POST', {
    phone: routeOtpPhone,
  });
  assert(sendOtpHttpRes.status === 200, 'HTTP: POST /api/auth/otp/send returns 200 OK');
  assert(sendOtpHttpRes.json?.success === true, 'HTTP: OTP send route returns success');

  const verifyOtpHttpRes = await makeReq('/api/auth/otp/verify', 'POST', {
    phone: routeOtpPhone,
    otp: sendOtpHttpRes.json?.data?.debugOtp,
  });
  assert(verifyOtpHttpRes.status === 200, 'HTTP: POST /api/auth/otp/verify returns 200 OK');
  assert(verifyOtpHttpRes.json?.data?.verified === true, 'HTTP: OTP verify route confirms phone');

  // Register a new worker for HTTP test
  const httpWorkerPhone = '+919988776699';
  await OtpService.sendOtp(httpWorkerPhone);
  const httpReg = await AuthService.register({
    name: 'Ganesh Plumber',
    phone: httpWorkerPhone,
    email: 'ganesh.plumber@shramsetu.in',
    password: 'password123',
    role: 'WORKER',
    phoneVerified: true,
  });
  const httpToken = httpReg.token;

  // 1. Test POST /api/workers/step/1 (mounted under /api)
  const step1HttpRes = await makeReq('/api/workers/step/1', 'POST', {
    name: 'Ganesh Plumber',
    email: 'ganesh.plumber@shramsetu.in',
    phone: httpWorkerPhone,
  }, httpToken);
  assert(step1HttpRes.status === 200, 'HTTP: POST /api/workers/step/1 returns 200 OK (not 404)');
  assert(step1HttpRes.json?.success === true, 'HTTP: POST /api/workers/step/1 has success: true');

  // 2. Test GET /api/workers/registration-status
  const regStatusHttpRes = await makeReq('/api/workers/registration-status', 'GET', null, httpToken);
  assert(regStatusHttpRes.status === 200, 'HTTP: GET /api/workers/registration-status returns 200 OK');
  assert(regStatusHttpRes.json?.data?.name === 'Ganesh Plumber', 'HTTP: Returns saved worker identity');

  // 3. Test POST /api/v1/workers/step/2 (mounted under /api/v1)
  const step2HttpRes = await makeReq('/api/v1/workers/step/2', 'POST', {
    phoneVerified: true,
    phone: httpWorkerPhone,
  }, httpToken);
  assert(step2HttpRes.status === 200, 'HTTP: POST /api/v1/workers/step/2 returns 200 OK');

  server.close();

  console.log(`\n================================`);
  console.log(`Summary: ${passed}/${total} Registration Flow tests passed!`);
  console.log(`================================\n`);

  process.exit(passed === total ? 0 : 1);
}

runRegistrationFlowTests().catch((err) => {
  console.error('Registration flow test error:', err);
  process.exit(1);
});
