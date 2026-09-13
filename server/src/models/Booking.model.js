import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
      index: true,
      alias: 'customerId',
    },
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      required: false,
      default: null,
      index: true,
      alias: 'cooperativeId',
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // or 'Worker' depending on dispatch flow, keeping User ref compatible
      default: null,
      index: true,
      alias: 'workerId',
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null,
      index: true,
      alias: 'serviceId',
    },
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    trade: {
      type: String,
      required: [true, 'Trade classification is required'],
      trim: true,
      index: true,
    },
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
      serviceAddress: {
        street: { type: String, trim: true },
        city: { type: String, trim: true, index: true },
        state: { type: String, trim: true },
        pincode: { type: String, trim: true, index: true },
        landmark: { type: String, trim: true },
      },
    },
    scheduledTime: {
      start: {
        type: Date,
        required: [true, 'Scheduled start date/time is required'],
        index: true,
      },
      end: {
        type: Date,
        default: null,
      },
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'confirmed',
          'assigned',
          'in_progress',
          'completed',
          'cancelled',
          'disputed',
        ],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'pending',
      index: true,
    },
    price: {
      floorRateAmount: {
        type: Number,
        required: [true, 'Floor rate amount is required'],
        min: 0,
      },
      totalAmount: {
        type: Number,
        required: [true, 'Total price amount is required'],
        min: 0,
      },
      commissionCut: {
        type: Number,
        default: 0, // 0% platform middleman cut
        min: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    paymentStatus: {
      type: String,
      enum: {
        values: [
          'pending',
          'held',
          'escrow_locked',
          'released',
          'refunded',
          'failed',
          'disputed',
        ],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
      index: true,
      alias: 'escrowStatus',
    },
    qrVerification: {
      token: { type: String, default: null },
      otpCode: { type: String, default: null },
      isVerified: { type: Boolean, default: false },
      verifiedAt: { type: Date, default: null },
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
      cancelledAt: Date,
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

// High-speed compound and geospatial indexes
bookingSchema.index({ 'location.coordinates': '2dsphere' });
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ worker: 1, status: 1 });
bookingSchema.index({ cooperative: 1, status: 1 });
bookingSchema.index({ status: 1, 'scheduledTime.start': 1 });
bookingSchema.index({ 'location.serviceAddress.city': 1, trade: 1, status: 1 });

// Backward compatibility virtuals
bookingSchema.virtual('scheduledDate')
  .get(function () { return this.scheduledTime?.start; })
  .set(function (v) {
    if (!this.scheduledTime) this.scheduledTime = {};
    this.scheduledTime.start = v;
  });

bookingSchema.virtual('floorRateAmount')
  .get(function () { return this.price?.floorRateAmount; })
  .set(function (v) {
    if (!this.price) this.price = {};
    this.price.floorRateAmount = v;
  });

bookingSchema.virtual('escrowAmount')
  .get(function () { return this.price?.totalAmount; })
  .set(function (v) {
    if (!this.price) this.price = {};
    this.price.totalAmount = v;
  });

bookingSchema.virtual('otpCode')
  .get(function () { return this.qrVerification?.otpCode; })
  .set(function (v) {
    if (!this.qrVerification) this.qrVerification = {};
    this.qrVerification.otpCode = v;
  });

bookingSchema.virtual('qrToken')
  .get(function () { return this.qrVerification?.token; })
  .set(function (v) {
    if (!this.qrVerification) this.qrVerification = {};
    this.qrVerification.token = v;
  });

bookingSchema.virtual('serviceAddress')
  .get(function () { return this.location?.serviceAddress; })
  .set(function (v) {
    if (!this.location) this.location = {};
    this.location.serviceAddress = v;
  });

export const Booking = mongoose.model('Booking', bookingSchema);
