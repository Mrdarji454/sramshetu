import { CatalogService } from '../src/services/service.service.js';
import { BookingService, VALID_TRANSITIONS, normalizeStatus } from '../src/services/booking.service.js';

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

async function runBookingFlowTests() {
  console.log('--- Starting ShramSetu Booking Workflow & State Machine Tests ---\n');

  // Test 1: Service Catalog Lookup & Filter
  const allServices = await CatalogService.getServices();
  assert(Array.isArray(allServices) && allServices.length >= 6, 'CatalogService returns pre-seeded trade services');
  
  const electricalServices = await CatalogService.getServices({ category: 'Electrical' });
  assert(electricalServices.length > 0 && electricalServices[0].category === 'Electrical', 'CatalogService filters services by category');

  // Test 2: Suitable Cooperatives & Workers Discovery
  const suitable = await BookingService.getSuitableCooperativesAndWorkers({
    trade: 'Electrical & Power Systems',
    city: 'Pune',
    pincode: '411038',
  });
  assert(suitable.cooperatives.length > 0, 'Discovers cooperatives operating in Pune');
  assert(suitable.workers.length > 0, 'Discovers matching artisans for electrical trade');
  assert(suitable.recommendedAllocation.suggestedWorker !== undefined, 'Provides recommended fair AI allocation');

  // Test 3: Customer Creates Booking
  const mockCustomerUserId = '65f123456789012345678901';
  const newBooking = await BookingService.createBooking(mockCustomerUserId, {
    serviceName: 'Electrical & Power Systems',
    trade: 'Electrical & Power Systems',
    location: {
      serviceAddress: {
        street: 'Flat 101, Surya Heights, Baner',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
        landmark: 'Near D-Mart',
      },
    },
    scheduledTime: {
      start: new Date(Date.now() + 86400000),
    },
    price: {
      floorRateAmount: 450,
      totalAmount: 900,
    },
    specialInstructions: 'Switchboard sparking in master bedroom',
  });

  assert(newBooking.status === 'PENDING', 'New booking starts in PENDING status');
  assert(newBooking.qrVerification?.token?.startsWith('QR-SS-'), 'Generates secure QR token');
  assert(newBooking.qrVerification?.otpCode?.length === 4, 'Generates 4-digit OTP code');
  assert(newBooking.price.commissionCut === 0, 'Guarantees 0% middleman commission');
  assert(newBooking.statusHistory.length === 1, 'Records initial status in statusHistory');

  // Test 4: Cooperative Assigns Suitable Worker
  const mockCoopId = '65f123456789012345678903';
  const mockWorkerId = '65f123456789012345678902';
  const assigned = await BookingService.assignWorker(
    newBooking.id,
    mockWorkerId,
    mockCoopId,
    'COOPERATIVE'
  );

  assert(assigned.status === 'ASSIGNED', 'Status transitions from PENDING to ASSIGNED upon cooperative dispatch');
  assert(String(assigned.worker) === mockWorkerId || String(assigned.workerId) === mockWorkerId, 'Worker reference attached');
  assert(assigned.statusHistory.some((h) => h.status === 'ASSIGNED'), 'statusHistory logs worker assignment');

  // Test 5: Worker Accepts Assignment
  const accepted = await BookingService.acceptBooking(newBooking.id, mockWorkerId);
  assert(accepted.status === 'ACCEPTED', 'Status transitions from ASSIGNED to ACCEPTED when worker confirms');

  // Test 6: Worker Status Progression: ACCEPTED -> ON_THE_WAY -> IN_PROGRESS -> COMPLETED
  const onTheWay = await BookingService.updateBookingStatus(
    newBooking.id,
    'ON_THE_WAY',
    mockWorkerId,
    'WORKER',
    { note: 'Artisan has departed towards customer location' }
  );
  assert(onTheWay.status === 'ON_THE_WAY', 'Status transitions from ACCEPTED to ON_THE_WAY');

  const inProgress = await BookingService.updateBookingStatus(
    newBooking.id,
    'IN_PROGRESS',
    mockWorkerId,
    'WORKER',
    { note: 'Artisan arrived and commenced diagnostic work' }
  );
  assert(inProgress.status === 'IN_PROGRESS', 'Status transitions from ON_THE_WAY to IN_PROGRESS');

  const completed = await BookingService.updateBookingStatus(
    newBooking.id,
    'COMPLETED',
    mockWorkerId,
    'WORKER',
    { note: 'Wiring repairs completed and circuits tested' }
  );
  assert(completed.status === 'COMPLETED', 'Status transitions from IN_PROGRESS to COMPLETED');
  assert(completed.paymentStatus === 'released', 'Escrow payment marked released on completion');
  assert(completed.qrVerification?.isVerified === true, 'QR verification marked verified on completion');

  // Test 7: State Machine Blocks Invalid Transitions
  // 7a: Cannot transition out of COMPLETED (terminal state)
  let terminalErr = null;
  try {
    await BookingService.updateBookingStatus(newBooking.id, 'IN_PROGRESS', mockWorkerId, 'WORKER');
  } catch (err) {
    terminalErr = err;
  }
  assert(terminalErr && terminalErr.statusCode === 400, 'Blocks transition out of terminal state COMPLETED (400)');

  // 7b: Cannot jump from PENDING directly to COMPLETED
  const pendingBooking = await BookingService.createBooking(mockCustomerUserId, {
    serviceName: 'Plumbing Service',
    trade: 'Plumbing & Water Sanitation',
    location: {
      serviceAddress: { street: 'FC Road', city: 'Pune', pincode: '411004' },
    },
    scheduledTime: { start: new Date(Date.now() + 86400000) },
  });

  let illegalJumpErr = null;
  try {
    await BookingService.updateBookingStatus(pendingBooking.id, 'COMPLETED', mockWorkerId, 'WORKER');
  } catch (err) {
    illegalJumpErr = err;
  }
  assert(illegalJumpErr && illegalJumpErr.statusCode === 400, 'Blocks illegal jump from PENDING to COMPLETED (400)');

  // 7c: Cannot jump from ASSIGNED directly to IN_PROGRESS (must accept & travel first)
  await BookingService.assignWorker(pendingBooking.id, mockWorkerId, mockCoopId, 'COOPERATIVE');
  let skipAcceptErr = null;
  try {
    await BookingService.updateBookingStatus(pendingBooking.id, 'IN_PROGRESS', mockWorkerId, 'WORKER');
  } catch (err) {
    skipAcceptErr = err;
  }
  assert(skipAcceptErr && skipAcceptErr.statusCode === 400, 'Blocks illegal jump from ASSIGNED directly to IN_PROGRESS (400)');

  // 7d: Unauthorized role trying to complete job
  let unauthorizedRoleErr = null;
  try {
    await BookingService.updateBookingStatus(pendingBooking.id, 'ACCEPTED', mockCustomerUserId, 'USER');
  } catch (err) {
    unauthorizedRoleErr = err;
  }
  assert(unauthorizedRoleErr && unauthorizedRoleErr.statusCode === 403, 'Customer role forbidden from accepting/progressing worker status (403)');

  // Test 8: Worker Rejection and Reassignment Flow
  const rejectBookingItem = await BookingService.createBooking(mockCustomerUserId, {
    serviceName: 'Carpentry Repairs',
    trade: 'Carpentry & Woodwork',
    location: {
      serviceAddress: { street: 'Kothrud Depot', city: 'Pune', pincode: '411038' },
    },
    scheduledTime: { start: new Date(Date.now() + 86400000) },
  });
  await BookingService.assignWorker(rejectBookingItem.id, mockWorkerId, mockCoopId, 'COOPERATIVE');

  const rejected = await BookingService.rejectBooking(rejectBookingItem.id, mockWorkerId, 'Artisan already booked for another site');
  assert(rejected.status === 'REJECTED', 'Status transitions to REJECTED when worker declines');
  assert(rejected.rejectionReason === 'Artisan already booked for another site', 'Preserves worker rejection reason');

  // Cooperative reassigns to different worker
  const secondWorkerId = '65f123456789012345678906';
  const reassigned = await BookingService.assignWorker(rejectBookingItem.id, secondWorkerId, mockCoopId, 'COOPERATIVE');
  assert(reassigned.status === 'ASSIGNED', 'Status transitions from REJECTED back to ASSIGNED upon cooperative reassignment');
  assert(reassigned.rejectionReason === null, 'Clears rejectionReason upon new assignment');

  // Test 9: Customer Cancellation Flow
  const cancelableBooking = await BookingService.createBooking(mockCustomerUserId, {
    serviceName: 'Masonry Work',
    trade: 'Civil Construction & Masonry',
    location: {
      serviceAddress: { street: 'Shivaji Nagar', city: 'Pune', pincode: '411005' },
    },
    scheduledTime: { start: new Date(Date.now() + 86400000) },
  });

  const cancelled = await BookingService.updateBookingStatus(
    cancelableBooking.id,
    'CANCELLED',
    mockCustomerUserId,
    'USER',
    { note: 'Customer no longer requires service' }
  );
  assert(cancelled.status === 'CANCELLED', 'Customer can cancel PENDING booking');

  console.log('\n================================');
  console.log(`Summary: ${passed}/${total} booking workflow tests passed!`);
  console.log('================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runBookingFlowTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});

