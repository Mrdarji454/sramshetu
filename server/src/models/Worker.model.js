import mongoose from 'mongoose';

const skillItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    nsdcLevel: { type: String, trim: true },
    certifiedDate: { type: Date, default: null },
    certifiedBy: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, default: 0 },
    serviceRadiusKm: { type: Number, min: 1, max: 100, default: 15 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const workerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
      alias: 'userId',
    },
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      required: [true, 'Cooperative reference is required'],
      index: true,
      alias: 'cooperativeId',
    },
    skills: [skillItemSchema],
    experience: {
      years: {
        type: Number,
        default: 0,
        min: 0,
      },
      primaryTrade: {
        type: String,
        required: [true, 'Primary trade is required'],
        trim: true,
        index: true,
      },
      subTrades: [{ type: String, trim: true }],
      bio: { type: String, trim: true, maxlength: 1000 },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [73.8567, 18.5204],
      },
      latitude: {
        type: Number,
        default: 18.5204,
      },
      longitude: {
        type: Number,
        default: 73.8567,
      },
      address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true, index: true },
        state: { type: String, trim: true, index: true },
        pincode: { type: String, trim: true, index: true },
      },
      workingRadiusKm: {
        type: Number,
        default: 15,
        min: 1,
      },
    },
    latitude: {
      type: Number,
      default: 18.5204,
    },
    longitude: {
      type: Number,
      default: 73.8567,
    },
    serviceArea: {
      radiusKm: {
        type: Number,
        default: 15,
        min: 1,
      },
      city: { type: String, trim: true, default: 'Pune' },
      pincodes: [{ type: String, trim: true }],
    },
    currentZone: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    temporaryZone: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    shiftStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'ACTIVE', 'DECLINED', 'EXPIRED'],
      default: 'NONE',
      index: true,
    },
    shiftAcceptedAt: { type: Date, default: null },
    shiftExpiresAt: { type: Date, default: null },
    availability: {
      status: {
        type: String,
        enum: ['available', 'busy', 'on_leave', 'offline'],
        default: 'available',
        index: true,
      },
      workingDays: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
      hours: {
        start: { type: String, default: '08:00' },
        end: { type: String, default: '18:00' },
      },
    },
    verificationStatus: {
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
        index: true,
      },
      aadhaarVerified: {
        type: Boolean,
        default: false,
        index: true,
      },
      nsdcCertified: {
        type: Boolean,
        default: false,
      },
      policeVerification: {
        type: String,
        enum: ['pending', 'cleared', 'rejected'],
        default: 'pending',
      },
      verifiedAt: { type: Date, default: null },
      documents: [
        {
          docType: { type: String, required: true },
          url: { type: String, required: true },
          verified: { type: Boolean, default: false },
        },
      ],
    },
    rating: {
      average: {
        type: Number,
        default: 5.0,
        min: 1,
        max: 5,
        index: true,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    rates: {
      dailyFloorRate: {
        type: Number,
        required: [true, 'Daily floor rate is required'],
        min: 0,
      },
      hourlyRate: {
        type: Number,
        required: [true, 'Hourly rate is required'],
        min: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    serviceRadius: { type: Number, min: 1, max: 100 },
    liveLocation: { coordinates: { type: [Number], default: undefined }, updatedAt: Date },
    jobsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    payoutDetails: {
      upiId: { type: String, trim: true },
      bankAccountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true },
      accountHolderName: { type: String, trim: true },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ─── Onboarding / Registration Fields ───────────────────────────────────
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    phoneVerified: { type: Boolean, default: false },
    profileImage: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, maxlength: 2000 },
    profession: { type: String, trim: true },
    customProfession: { type: String, trim: true, default: null },

    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      pincode: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
      city: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },

    documents: {
      aadhaar: {
        expiresAt: { type: Date, default: null },
        url: { type: String, default: null },
        name: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
      },
      addressProof: {
        expiresAt: { type: Date, default: null },
        docType: { type: String, default: 'Electricity Bill' },
        url: { type: String, default: null },
        name: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
      },
      eshramCard: {
        expiresAt: { type: Date, default: null },
        url: { type: String, default: null },
        name: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
      },
    },

    generatedDocuments: [{
      type: { type: String, trim: true },
      fileName: { type: String, trim: true },
      content: { type: String },
      generatedAt: { type: Date, default: Date.now },
      jobsCompleted: { type: Number, min: 0 },
      totalEarnings: { type: Number, min: 0 },
      workerId: { type: String, trim: true },
    }],

    eshramProvided: { type: Boolean, default: false },
    // `cooperative` is aliased as `cooperativeId` below; keep a single field definition to avoid Mongoose path conflicts.
    registrationStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },

    rejectionReason: { type: String, trim: true, default: null },

    registrationProgress: {
      currentStep: { type: Number, default: 1 },
      maxCompletedStep: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for high performance searches
workerSchema.index({ 'location.coordinates': '2dsphere' });
workerSchema.index({ cooperative: 1, 'availability.status': 1 });
workerSchema.index({ 'experience.primaryTrade': 1, 'rating.average': -1 });
workerSchema.index({ 'verificationStatus.status': 1, 'availability.status': 1 });
workerSchema.index({ 'location.city': 1, 'experience.primaryTrade': 1 });

// Backward compatibility virtuals
workerSchema.virtual('trade')
  .get(function () { return this.experience?.primaryTrade; })
  .set(function (v) {
    if (!this.experience) this.experience = {};
    this.experience.primaryTrade = v;
  });

workerSchema.virtual('subTrade')
  .get(function () { return this.experience?.subTrades?.[0]; })
  .set(function (v) {
    if (!this.experience) this.experience = {};
    this.experience.subTrades = v ? [v] : [];
  });

workerSchema.virtual('experienceYears')
  .get(function () { return this.experience?.years; })
  .set(function (v) {
    if (!this.experience) this.experience = {};
    this.experience.years = v;
  });

workerSchema.virtual('dailyFloorRate')
  .get(function () { return this.rates?.dailyFloorRate; })
  .set(function (v) {
    if (!this.rates) this.rates = {};
    this.rates.dailyFloorRate = v;
  });

workerSchema.virtual('hourlyRate')
  .get(function () { return this.rates?.hourlyRate; })
  .set(function (v) {
    if (!this.rates) this.rates = {};
    this.rates.hourlyRate = v;
  });

workerSchema.virtual('availabilityStatus')
  .get(function () { return this.availability?.status; })
  .set(function (v) {
    if (!this.availability) this.availability = {};
    this.availability.status = v;
  });

workerSchema.virtual('workingRadiusKm')
  .get(function () { return this.location?.workingRadiusKm; })
  .set(function (v) {
    if (!this.location) this.location = {};
    this.location.workingRadiusKm = v;
  });

workerSchema.virtual('totalReviews')
  .get(function () { return this.rating?.count; })
  .set(function (v) {
    if (!this.rating) this.rating = {};
    this.rating.count = v;
  });

workerSchema.virtual('aadhaarVerified')
  .get(function () { return this.verificationStatus?.aadhaarVerified; })
  .set(function (v) {
    if (!this.verificationStatus) this.verificationStatus = {};
    this.verificationStatus.aadhaarVerified = v;
  });

workerSchema.virtual('nsdcCertified')
  .get(function () { return this.verificationStatus?.nsdcCertified; })
  .set(function (v) {
    if (!this.verificationStatus) this.verificationStatus = {};
    this.verificationStatus.nsdcCertified = v;
  });

workerSchema.virtual('isVerified')
  .get(function () {
    const verStatus = String(this.verificationStatus?.status || '').toLowerCase();
    return verStatus === 'verified' || this.registrationStatus === 'APPROVED';
  });

export const Worker = mongoose.model('Worker', workerSchema);
export const WorkerProfile = Worker; // Alias for backward compatibility

