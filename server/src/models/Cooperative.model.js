import mongoose from 'mongoose';

const cooperativeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cooperative society name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    registrationDetails: {
      registrationNumber: {
        type: String,
        required: [true, 'State registration number is required'],
        unique: true,
        trim: true,
        index: true,
      },
      state: {
        type: String,
        required: [true, 'Registration state is required'],
        trim: true,
        index: true,
      },
      registeredYear: {
        type: Number,
        default: () => new Date().getFullYear(),
      },
      registrarApproved: {
        type: Boolean,
        default: true,
      },
      certificateUrl: {
        type: String,
        default: null,
      },
      authority: {
        type: String,
        default: 'State Registrar of Cooperative Societies',
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    serviceCategories: [
      {
        type: String,
        trim: true,
        index: true,
      },
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: { type: String, trim: true },
      district: { type: String, trim: true, index: true },
      state: { type: String, trim: true, index: true },
      operationalPincodes: [{ type: String, trim: true }],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending', 'pending_audit', 'flagged', 'suspended'],
      default: 'pending',
      index: true,
    },
    governance: {
      presidentName: { type: String, trim: true },
      secretaryName: { type: String, trim: true },
      contactEmail: { type: String, trim: true },
      contactPhone: { type: String, trim: true },
    },
    welfareFund: {
      balance: { type: Number, default: 0, min: 0 },
      totalDisbursed: { type: Number, default: 0, min: 0 },
      schemes: [
        {
          name: { type: String, required: true },
          description: String,
          coverageAmount: Number,
        },
      ],
    },
    trustScore: {
      type: Number,
      default: 95.0,
      min: 0,
      max: 100,
      index: true,
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

// Indexes
cooperativeSchema.index({ 'location.coordinates': '2dsphere' });
cooperativeSchema.index({ name: 'text', description: 'text' });
cooperativeSchema.index({ 'location.state': 1, 'location.district': 1, verificationStatus: 1 });
cooperativeSchema.index({ serviceCategories: 1, verificationStatus: 1 });

// Backward compatibility virtuals
cooperativeSchema.virtual('registrationNumber')
  .get(function () { return this.registrationDetails?.registrationNumber; })
  .set(function (v) {
    if (!this.registrationDetails) this.registrationDetails = {};
    this.registrationDetails.registrationNumber = v;
  });

cooperativeSchema.virtual('state')
  .get(function () { return this.registrationDetails?.state || this.location?.state; })
  .set(function (v) {
    if (!this.registrationDetails) this.registrationDetails = {};
    this.registrationDetails.state = v;
    if (!this.location) this.location = {};
    this.location.state = v;
  });

cooperativeSchema.virtual('district')
  .get(function () { return this.location?.district; })
  .set(function (v) {
    if (!this.location) this.location = {};
    this.location.district = v;
  });

cooperativeSchema.virtual('address')
  .get(function () { return this.location?.address; })
  .set(function (v) {
    if (!this.location) this.location = {};
    this.location.address = v;
  });

cooperativeSchema.virtual('presidentName')
  .get(function () { return this.governance?.presidentName; })
  .set(function (v) {
    if (!this.governance) this.governance = {};
    this.governance.presidentName = v;
  });

cooperativeSchema.virtual('secretaryName')
  .get(function () { return this.governance?.secretaryName; })
  .set(function (v) {
    if (!this.governance) this.governance = {};
    this.governance.secretaryName = v;
  });

cooperativeSchema.virtual('contactEmail')
  .get(function () { return this.governance?.contactEmail; })
  .set(function (v) {
    if (!this.governance) this.governance = {};
    this.governance.contactEmail = v;
  });

cooperativeSchema.virtual('contactPhone')
  .get(function () { return this.governance?.contactPhone; })
  .set(function (v) {
    if (!this.governance) this.governance = {};
    this.governance.contactPhone = v;
  });

cooperativeSchema.virtual('welfareFundBalance')
  .get(function () { return this.welfareFund?.balance; })
  .set(function (v) {
    if (!this.welfareFund) this.welfareFund = {};
    this.welfareFund.balance = v;
  });

cooperativeSchema.virtual('tradesSupported')
  .get(function () { return this.serviceCategories; })
  .set(function (v) { this.serviceCategories = v; });

cooperativeSchema.virtual('status')
  .get(function () { return this.verificationStatus; })
  .set(function (v) { this.verificationStatus = v; });

cooperativeSchema.virtual('memberCount')
  .get(function () { return this.members?.length || 0; });

export const Cooperative = mongoose.model('Cooperative', cooperativeSchema);
