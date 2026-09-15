import http from 'http';
import app from '../../src/app.js';
import { AuthService } from '../../src/services/auth.service.js';

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

async function runOnboardingTests() {
  console.log('\n===============================================================');
  console.log('  Running Worker & Cooperative Onboarding & Admin Review Tests');
  console.log('===============================================================\n');

  // 1. Spin up ephemeral server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Server] Running on ephemeral port ${port}\n`);

  try {
    // 2. Register a new Worker
    console.log('--- Step 1: Register New Worker ---');
    const workerRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ganesh Shinde',
        phone: '+919833445566',
        password: 'workerPassword123',
        role: 'WORKER',
      }),
    });
    const workerRegData = await workerRegRes.json();
    assert(workerRegRes.status === 201, 'Worker registers with 201 Created');
    const workerToken = workerRegData.data.token;
    const workerUserId = workerRegData.data.user.id || workerRegData.data.user._id;

    // 3. Worker submits Onboarding
    console.log('\n--- Step 2: Worker Submits Onboarding Details ---');
    const onboardingPayload = {
      name: 'Ganesh Shinde',
      primaryTrade: 'Plumbing & Water Sanitation',
      subTrades: ['CPVC Piping', 'Hydro-Pneumatic Pumps'],
      years: 6,
      bio: 'Commercial plumber with 6 years experience in municipal water mains and sanitary high-rises.',
      skills: ['CPVC Piping', 'Drain Jetting', 'Pump Diagnostics'],
      nsdcLevel: 'NSDC Level 3 Certified',
      dailyFloorRate: 1150,
      hourlyRate: 400,
      address: {
        street: 'Shivaji Chowk, Deccan',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411004',
      },
      workingRadiusKm: 18,
      availability: {
        status: 'available',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        hours: { start: '08:30', end: '17:30' },
      },
      documents: [
        { docType: 'Aadhaar Card', url: 'https://example.com/aadhaar_ganesh.jpg', name: 'aadhaar_front.jpg' },
        { docType: 'NSDC Certificate', url: 'https://example.com/nsdc_plumbing.pdf', name: 'nsdc_cert.pdf' },
      ],
    };

    const workerOnboardRes = await fetch(`${baseUrl}/api/workers/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify(onboardingPayload),
    });
    const workerOnboardData = await workerOnboardRes.json();
    assert(workerOnboardRes.status === 200, 'Worker onboarding responds with 200 OK');
    assert(workerOnboardData.success === true, 'Worker onboarding returns success: true');
    assert(workerOnboardData.data.experience.primaryTrade === 'Plumbing & Water Sanitation', 'Primary trade saved correctly');
    assert(workerOnboardData.data.rates.dailyFloorRate === 1150, 'Daily floor rate saved correctly');
    assert(workerOnboardData.data.verificationStatus.status === 'pending', 'Verification status set to pending');

    // 4. Worker checks Verification Status
    console.log('\n--- Step 3: Worker Checks Verification Status ---');
    const workerVerRes = await fetch(`${baseUrl}/api/workers/verification-status`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    const workerVerData = await workerVerRes.json();
    assert(workerVerRes.status === 200, 'GET /api/workers/verification-status succeeds');
    assert(workerVerData.data.status === 'pending', 'Worker status is currently pending');
    assert(Array.isArray(workerVerData.data.checklist) && workerVerData.data.checklist.length > 0, 'Verification checklist returned');
    assert(workerVerData.data.completionPercentage >= 50, 'Checklist shows substantial completion');

    // 5. Worker updates availability
    console.log('\n--- Step 4: Worker Updates Availability ---');
    const availRes = await fetch(`${baseUrl}/api/workers/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ status: 'busy', workingRadiusKm: 25 }),
    });
    const availData = await availRes.json();
    assert(availRes.status === 200, 'PATCH /api/workers/availability succeeds');
    assert(availData.data.availability.status === 'busy' || availData.data.availabilityStatus === 'busy', 'Availability updated to busy');

    // 6. Register a new Cooperative Society
    console.log('\n--- Step 5: Register New Cooperative Society ---');
    const coopRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nashik Shramik Guild',
        phone: '+919877889900',
        password: 'coopPassword123',
        role: 'COOPERATIVE',
      }),
    });
    const coopRegData = await coopRegRes.json();
    assert(coopRegRes.status === 201, 'Cooperative registers with 201 Created');
    const coopToken = coopRegData.data.token;
    const coopUserId = coopRegData.data.user.id || coopRegData.data.user._id;

    // 7. Cooperative Submits Onboarding
    console.log('\n--- Step 6: Cooperative Submits Onboarding Details ---');
    const coopOnboardingPayload = {
      name: 'Nashik Shramik Guild',
      registrationNumber: 'NSK-COOP-2023-4411',
      state: 'Maharashtra',
      registeredYear: 2023,
      authority: 'State Registrar of Cooperative Societies, Nashik',
      description: 'Nashik union for building and plumbing trades.',
      serviceCategories: ['Plumbing & Water Sanitation', 'Masonry & Civil Works'],
      address: 'Main Road, Panchavati',
      district: 'Nashik',
      operationalPincodes: ['422001', '422003'],
      presidentName: 'Eknath Shinde',
      secretaryName: 'Sunita Patil',
      contactEmail: 'nashik.guild@shramsetu.gov.in',
      contactPhone: '+91 98778 89900',
    };

    const coopOnboardRes = await fetch(`${baseUrl}/api/cooperatives/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${coopToken}`,
      },
      body: JSON.stringify(coopOnboardingPayload),
    });
    const coopOnboardData = await coopOnboardRes.json();
    assert(coopOnboardRes.status === 200, 'Cooperative onboarding responds with 200 OK');
    assert(coopOnboardData.data.name === 'Nashik Shramik Guild', 'Cooperative name matches');
    assert(coopOnboardData.data.verificationStatus === 'pending', 'Cooperative verification status is pending');

    // 8. Cooperative Enrolls a Member to Roster
    console.log('\n--- Step 7: Cooperative Enrolls Artisan Member ---');
    const addMemberRes = await fetch(`${baseUrl}/api/cooperatives/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${coopToken}`,
      },
      body: JSON.stringify({
        name: 'Vilas Kadam',
        phone: '+91 98221 55667',
        trade: 'Plumbing & Water Sanitation',
        dailyFloorRate: 1100,
      }),
    });
    const addMemberData = await addMemberRes.json();
    assert(addMemberRes.status === 201, 'POST /api/cooperatives/members succeeds with 201 Created');
    assert(addMemberData.data.name === 'Vilas Kadam', 'New member name matches');

    // 9. Cooperative Lists Members
    console.log('\n--- Step 8: Cooperative Retrieves Member Roster ---');
    const membersRes = await fetch(`${baseUrl}/api/cooperatives/members`, {
      headers: { Authorization: `Bearer ${coopToken}` },
    });
    const membersData = await membersRes.json();
    assert(membersRes.status === 200, 'GET /api/cooperatives/members succeeds');
    assert(Array.isArray(membersData.data) && membersData.data.some((m) => m.name === 'Vilas Kadam'), 'Roster includes newly added member');

    // 10. Register & Login as Platform Admin
    console.log('\n--- Step 9: Login as Admin & Inspect Verification Queue ---');
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'GovTech Lead Auditor',
        phone: '+919999999999',
        password: 'adminSecret123',
        role: 'ADMIN',
      }),
    });

    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '+919999999999',
        password: 'adminSecret123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data.token;

    const verQueueRes = await fetch(`${baseUrl}/api/admin/verifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const verQueueData = await verQueueRes.json();
    assert(verQueueRes.status === 200, 'Admin fetches verification queue with 200');
    assert(Array.isArray(verQueueData.data), 'Verification requests returned in array');

    const workerReq = verQueueData.data.find((item) => item.applicantType === 'worker' && item.name === 'Ganesh Shinde');
    assert(Boolean(workerReq), 'Worker Ganesh Shinde is present in admin verification queue');

    const coopReq = verQueueData.data.find((item) => item.applicantType === 'cooperative' && item.name === 'Nashik Shramik Guild');
    assert(Boolean(coopReq), 'Cooperative Nashik Shramik Guild is present in admin verification queue');

    // 11. Admin Approves Cooperative
    console.log('\n--- Step 10: Admin Approves Cooperative Society ---');
    const approveCoopRes = await fetch(`${baseUrl}/api/admin/verifications/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        applicantType: 'cooperative',
        applicantId: coopReq.applicantId,
        status: 'verified',
        remarks: 'All state bylaws verified and approved.',
      }),
    });
    assert(approveCoopRes.status === 200, 'Admin approval succeeds with 200 OK');

    // Check that Cooperative status is now verified
    const coopStatusRes = await fetch(`${baseUrl}/api/cooperatives/verification-status`, {
      headers: { Authorization: `Bearer ${coopToken}` },
    });
    const coopStatusData = await coopStatusRes.json();
    assert(coopStatusData.data.status === 'verified', 'Cooperative status is now verified');

    // 12. Admin Rejects Worker (with feedback note)
    console.log('\n--- Step 11: Admin Rejects Worker with Actionable Note ---');
    const rejectWorkerRes = await fetch(`${baseUrl}/api/admin/verifications/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        applicantType: 'worker',
        applicantId: workerReq.applicantId,
        status: 'rejected',
        remarks: 'Aadhaar scan is blurry. Please upload a clear scan with legible QR code.',
      }),
    });
    assert(rejectWorkerRes.status === 200, 'Admin rejection succeeds with 200 OK');

    // Worker checks verification status and sees rejection reason
    const workerRejectedRes = await fetch(`${baseUrl}/api/workers/verification-status`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    const workerRejectedData = await workerRejectedRes.json();
    assert(workerRejectedData.data.status === 'rejected', 'Worker status is now rejected');
    assert(workerRejectedData.data.rejectionReason.includes('blurry'), 'Worker can view specific rejection reason');

    // 13. Worker re-uploads document & Admin Approves
    console.log('\n--- Step 12: Worker Uploads New Document & Gets Approved ---');
    const uploadDocRes = await fetch(`${baseUrl}/api/workers/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({
        docType: 'Aadhaar Card Clear Scan',
        url: 'https://example.com/clear_aadhaar.jpg',
        name: 'clear_aadhaar_scan.jpg',
      }),
    });
    assert(uploadDocRes.status === 200, 'Worker document upload succeeds with 200');

    // Admin now approves the worker
    const approveWorkerRes = await fetch(`${baseUrl}/api/admin/verifications/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        applicantType: 'worker',
        applicantId: workerReq.applicantId,
        status: 'verified',
        remarks: 'Aadhaar e-KYC and NSDC skill certificate confirmed.',
      }),
    });
    assert(approveWorkerRes.status === 200, 'Admin approves worker after re-upload');

    // Worker checks verification status again
    const finalWorkerStatusRes = await fetch(`${baseUrl}/api/workers/verification-status`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    const finalWorkerStatusData = await finalWorkerStatusRes.json();
    assert(finalWorkerStatusData.data.status === 'verified', 'Worker is now certified and verified!');
    assert(finalWorkerStatusData.data.aadhaarVerified === true, 'Worker aadhaarVerified flag is true');

  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log('\n[Test Server] Ephemeral server closed.\n');
  }

  console.log('===============================================================');
  console.log(`  Summary: ${passedTests}/${totalTests} Onboarding & Verification Tests Passed!`);
  console.log('===============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runOnboardingTests().catch((err) => {
  console.error('Test execution failed with error:', err);
  process.exit(1);
});
