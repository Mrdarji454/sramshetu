import mongoose from 'mongoose';

const skillItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    nsdcLevel: { type: String, trim: true },
    certifiedDate: { type: Date, default: null },
    certifiedBy: { type: String, trim: true },
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

workerSchema.virtual('policeVerification')
  .get(function () { return this.verificationStatus?.policeVerification; })
  .set(function (v) {
    if (!this.verificationStatus) this.verificationStatus = {};
    this.verificationStatus.policeVerification = v;
  });

export const Worker = mongoose.model('Worker', workerSchema);
export const WorkerProfile = Worker; // Alias for backward compatibility

