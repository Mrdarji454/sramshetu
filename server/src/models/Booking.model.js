import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cooperativeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      default: null,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    trade: {
      type: String,
      required: true,
      trim: true,
    },
    serviceAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    floorRateAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    escrowAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    escrowStatus: {
      type: String,
      enum: ['pending', 'held', 'released', 'refunded', 'disputed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    otpCode: {
      type: String,
      default: null,
    },
    qrToken: {
      type: String,
      default: null,
    },
    customerRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    customerFeedback: {
      type: String,
      default: null,
    },
    specialInstructions: String,
  },
  {
    timestamps: true,
  }
);

export const Booking = mongoose.model('Booking', bookingSchema);

