import mongoose from 'mongoose';

const workerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    cooperativeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      required: true,
    },
    trade: {
      type: String,
      required: [true, 'Primary trade is required'],
      trim: true,
    },
    subTrade: {
      type: String,
      trim: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    dailyFloorRate: {
      type: Number,
      required: true,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    skills: [
      {
        name: String,
        nsdcLevel: String,
        certifiedDate: Date,
        certifiedBy: String,
      },
    ],
    aadhaarVerified: {
      type: Boolean,
      default: false,
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
    availabilityStatus: {
      type: String,
      enum: ['available', 'busy', 'on_leave', 'offline'],
      default: 'available',
    },
    workingRadiusKm: {
      type: Number,
      default: 10,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    jobsCompleted: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const WorkerProfile = mongoose.model('WorkerProfile', workerProfileSchema);

