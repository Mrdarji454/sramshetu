import mongoose from 'mongoose';

const cooperativeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cooperative society name is required'],
      trim: true,
      unique: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'State registration number is required'],
      unique: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    presidentName: {
      type: String,
      required: true,
      trim: true,
    },
    secretaryName: {
      type: String,
      trim: true,
    },
    welfareFundBalance: {
      type: Number,
      default: 0,
    },
    tradesSupported: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['verified', 'pending_audit', 'flagged', 'suspended'],
      default: 'pending_audit',
    },
    trustScore: {
      type: Number,
      default: 95.0,
      min: 0,
      max: 100,
    },
    contactEmail: String,
    contactPhone: String,
    address: String,
  },
  {
    timestamps: true,
  }
);

export const Cooperative = mongoose.model('Cooperative', cooperativeSchema);

