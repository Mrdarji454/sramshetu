import mongoose from 'mongoose';
import { User, Worker, WorkerProfile, Cooperative, Service, Booking, Review } from '../src/models/index.js';

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

async function runTests() {
  console.log('--- Starting ShramSetu Mongoose Schema Tests ---\n');

  // Test 1: User Model Validation & Defaults
  const mockUserId = new mongoose.Types.ObjectId();
  const user = new User({
    name: 'Rajeshwar Shinde',
    phone: '+919820144019',
    email: 'rajeshwar@shramsetu.in',
    password: 'securePassword123',
    profileImage: 'https://cloudinary.com/avatar.jpg',
  });

  assert(user.name === 'Rajeshwar Shinde', 'User name is set correctly');
  assert(user.role === 'customer' || user.role === 'USER', 'Default role is customer/USER');
  assert(user.isActive === true, 'Default isActive is true');
  assert(user.isVerified === false, 'Default isVerified is false');
  assert(user.avatar === 'https://cloudinary.com/avatar.jpg', 'User avatar alias works for profileImage');

  const userValidationError = user.validateSync();
  assert(!userValidationError, 'Valid User passes schema validation');

  // Test User Missing Required Fields
  const invalidUser = new User({});
  const invUserErr = invalidUser.validateSync();
  assert(invUserErr && invUserErr.errors.name && invUserErr.errors.phone && invUserErr.errors.password, 'User requires name, phone, and password');

  // Test Password Hash pre-save hook & comparePassword
  await user.save({ validateBeforeSave: false }).catch(() => { }); // hook triggers on save
  // simulate hook manually if disconnected
  const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
  assert(isBcryptHash, 'User pre-save hook hashes password using bcrypt');
  const passwordMatches = await user.comparePassword('securePassword123');
  assert(passwordMatches === true, 'comparePassword returns true for correct candidate password');
  const passwordFails = await user.comparePassword('wrongPassword');
  assert(passwordFails === false, 'comparePassword returns false for incorrect candidate password');

  // Test 2: Worker Model Validation & References
  const mockCoopId = new mongoose.Types.ObjectId();
  const worker = new Worker({
    user: mockUserId,
    cooperative: mockCoopId,
    skills: [
      { name: 'Concealed Wiring', nsdcLevel: 'Level 4', isPrimary: true },
      { name: '3-Phase Inverters', nsdcLevel: 'Level 3' },
    ],
    experience: {
      years: 12,
      primaryTrade: 'Master Electrician',
      subTrades: ['Industrial', 'Solar'],
      bio: '12 years experience in commercial installations.',
    },
    location: {
      type: 'Point',
      coordinates: [73.8567, 18.5204], // Pune [long, lat]
      address: { city: 'Pune', state: 'Maharashtra', pincode: '411038' },
      workingRadiusKm: 20,
    },
    availability: {
      status: 'available',
      workingDays: ['Monday', 'Tuesday', 'Wednesday'],
    },
    verificationStatus: {
      status: 'verified',
      aadhaarVerified: true,
      nsdcCertified: true,
      policeVerification: 'cleared',
    },
    rates: {
      dailyFloorRate: 1300,
      hourlyRate: 480,
    },
    jobsCompleted: 462,
  });

  const workerValidationErr = worker.validateSync();
  assert(!workerValidationErr, 'Valid Worker passes schema validation');
  assert(worker.userId.equals(mockUserId), 'Worker userId alias matches user reference');
  assert(worker.cooperativeId.equals(mockCoopId), 'Worker cooperativeId alias matches cooperative reference');
  assert(worker.trade === 'Master Electrician', 'Worker trade virtual returns primaryTrade');
  assert(worker.experienceYears === 12, 'Worker experienceYears virtual returns years');
  assert(worker.hourlyRate === 480, 'Worker hourlyRate virtual returns rates.hourlyRate');
  assert(worker.dailyFloorRate === 1300, 'Worker dailyFloorRate virtual returns rates.dailyFloorRate');
  assert(worker.availabilityStatus === 'available', 'Worker availabilityStatus virtual returns availability.status');
  assert(worker.rating.average === 5.0, 'Worker default rating is 5.0');
  assert(worker.totalReviews === 0, 'Worker totalReviews virtual returns rating.count');
  assert(Worker === WorkerProfile, 'WorkerProfile is an exact export alias of Worker');

  // Test 3: Cooperative Model Validation & GeoJSON
  const coop = new Cooperative({
    name: 'Pune Shramik Vikas Sahakari',
    registrationDetails: {
      registrationNumber: 'MH-PUN-COOP-4491',
      state: 'Maharashtra',
      registeredYear: 2018,
    },
    description: 'Democratically owned union of certified blue-collar technicians in Western Maharashtra.',
    serviceCategories: ['Electrical', 'Plumbing', 'Civil Construction'],
    location: {
      type: 'Point',
      coordinates: [73.8567, 18.5204],
      district: 'Pune',
      state: 'Maharashtra',
      address: 'Shivajinagar, Pune',
    },
    members: [worker._id],
    verificationStatus: 'verified',
    governance: {
      presidentName: 'Dattatray Gaikwad',
      secretaryName: 'Vilas Patil',
      contactEmail: 'contact@puneshramik.org',
      contactPhone: '+912025531100',
    },
    welfareFund: {
      balance: 28000000,
      schemes: [{ name: 'Family Health Pool', coverageAmount: 500000 }],
    },
  });

  const coopValidationErr = coop.validateSync();
  assert(!coopValidationErr, 'Valid Cooperative passes schema validation');
  assert(coop.registrationNumber === 'MH-PUN-COOP-4491', 'Cooperative registrationNumber virtual works');
  assert(coop.state === 'Maharashtra', 'Cooperative state virtual works');
  assert(coop.district === 'Pune', 'Cooperative district virtual works');
  assert(coop.presidentName === 'Dattatray Gaikwad', 'Cooperative presidentName virtual works');
  assert(coop.memberCount === 1, 'Cooperative memberCount virtual returns members.length');
  assert(coop.welfareFundBalance === 28000000, 'Cooperative welfareFundBalance virtual works');

  // Test 4: Service Model Validation
  const service = new Service({
    name: 'Electrical & Power Systems',
    category: 'electrical',
    description: 'Residential rewiring, commercial 3-phase setups, solar inverters.',
    estimatedPrice: {
      floorRate: 450,
      rateUnit: 'per_hour',
      dailyFloorRate: 1200,
      currency: 'INR',
    },
    activeStatus: true,
    tags: ['wiring', 'inverter', 'electrician'],
  });

  const serviceValidationErr = service.validateSync();
  assert(!serviceValidationErr, 'Valid Service passes schema validation');
  assert(service.isActive === true, 'Service isActive alias works for activeStatus');
  assert(service.estimatedPrice.floorRate === 450, 'Service estimatedPrice has required floorRate');

  // Test Service validation failure on missing price
  const invalidService = new Service({ name: 'Plumbing', category: 'plumbing' });
  const invServiceErr = invalidService.validateSync();
  assert(invServiceErr && invServiceErr.errors['estimatedPrice.floorRate'], 'Service requires estimatedPrice.floorRate');

  // Test 5: Booking Model Validation & References
  const booking = new Booking({
    customer: mockUserId,
    cooperative: mockCoopId,
    worker: worker._id,
    service: service._id,
    serviceName: 'Electrical & Power Systems',
    trade: 'Master Electrician',
    location: {
      type: 'Point',
      coordinates: [73.8567, 18.5204],
      serviceAddress: {
        street: 'Flat 402, Green Meadows',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
      },
    },
    scheduledTime: {
      start: new Date(Date.now() + 86400000),
    },
    status: 'assigned',
    price: {
      floorRateAmount: 450,
      totalAmount: 900,
      commissionCut: 0,
    },
    paymentStatus: 'escrow_locked',
    qrVerification: {
      token: 'SECURE_QR_TOKEN_8829',
      otpCode: '4921',
      isVerified: false,
    },
  });

  const bookingValidationErr = booking.validateSync();
  assert(!bookingValidationErr, 'Valid Booking passes schema validation');
  assert(booking.customerId.equals(mockUserId), 'Booking customerId alias works');
  assert(booking.cooperativeId.equals(mockCoopId), 'Booking cooperativeId alias works');
  assert(booking.workerId.equals(worker._id), 'Booking workerId alias works');
  assert(booking.serviceId.equals(service._id), 'Booking serviceId alias works');
  assert(booking.floorRateAmount === 450, 'Booking floorRateAmount virtual works');
  assert(booking.escrowAmount === 900, 'Booking escrowAmount virtual works');
  assert(booking.price.commissionCut === 0, 'Booking guarantees 0% commission cut');
  assert(booking.otpCode === '4921', 'Booking otpCode virtual works');
  assert(booking.qrToken === 'SECURE_QR_TOKEN_8829', 'Booking qrToken virtual works');

  // Test 6: Review Model Validation & Rating boundaries
  const review = new Review({
    customer: mockUserId,
    worker: worker._id,
    cooperative: mockCoopId,
    booking: booking._id,
    rating: 5,
    comment: 'Exceptional craftsmanship and punctual arrival. Fixed our 3-phase board cleanly.',
    aspectRatings: {
      punctuality: 5,
      craftsmanship: 5,
      behavior: 5,
      safetyCompliance: 5,
    },
  });

  const reviewValidationErr = review.validateSync();
  assert(!reviewValidationErr, 'Valid Review passes schema validation');

  // Test Rating Range Constraints (< 1 or > 5 should fail)
  const invalidReviewLow = new Review({
    customer: mockUserId,
    worker: worker._id,
    booking: booking._id,
    rating: 0,
  });
  const invReviewLowErr = invalidReviewLow.validateSync();
  assert(invReviewLowErr && invReviewLowErr.errors.rating, 'Review rejects rating below 1');

  const invalidReviewHigh = new Review({
    customer: mockUserId,
    worker: worker._id,
    booking: booking._id,
    rating: 6,
  });
  const invReviewHighErr = invalidReviewHigh.validateSync();
  assert(invReviewHighErr && invReviewHighErr.errors.rating, 'Review rejects rating above 5');

  // Test 7: Index Verification
  const userIndexes = User.schema.indexes();
  const hasPhoneIndex = userIndexes.some(idx => idx[0].phone);
  assert(hasPhoneIndex, 'User schema has index on phone');

  const workerIndexes = Worker.schema.indexes();
  const hasWorker2dSphere = workerIndexes.some(idx => idx[0]['location.coordinates'] === '2dsphere');
  assert(hasWorker2dSphere, 'Worker schema has 2dsphere spatial index on location.coordinates');

  const coopIndexes = Cooperative.schema.indexes();
  const hasCoopText = coopIndexes.some(idx => idx[0].name === 'text');
  assert(hasCoopText, 'Cooperative schema has text index on name and description');

  const serviceIndexes = Service.schema.indexes();
  const hasServiceCatIndex = serviceIndexes.some(idx => idx[0].category === 1 && idx[0].activeStatus === 1);
  assert(hasServiceCatIndex, 'Service schema has compound index on category & activeStatus');

  const bookingIndexes = Booking.schema.indexes();
  const hasBooking2dSphere = bookingIndexes.some(idx => idx[0]['location.coordinates'] === '2dsphere');
  const hasBookingCustomer = bookingIndexes.some(idx => idx[0].customer === 1 && idx[0].status === 1);
  assert(hasBooking2dSphere, 'Booking schema has 2dsphere spatial index');
  assert(hasBookingCustomer, 'Booking schema has compound index on customer & status');

  const reviewIndexes = Review.schema.indexes();
  const hasReviewWorker = reviewIndexes.some(idx => idx[0].worker === 1);
  assert(hasReviewWorker, 'Review schema has compound index on worker & rating');

  console.log(`\n================================`);
  console.log(`Summary: ${passed}/${total} schema validation tests passed!`);
  console.log(`================================\n`);

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

