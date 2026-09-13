import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      index: true,
      maxlength: [150, 'Service name cannot exceed 150 characters'],
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      trim: true,
      index: true,
    },
    hindiName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2500,
    },
    estimatedPrice: {
      floorRate: {
        type: Number,
        required: [true, 'Estimated floor price is required'],
        min: 0,
      },
      rateUnit: {
        type: String,
        enum: ['per_hour', 'per_day', 'fixed'],
        default: 'per_hour',
      },
      dailyFloorRate: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    activeStatus: {
      type: Boolean,
      default: true,
      index: true,
      alias: 'isActive',
    },
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      default: null,
      index: true,
    },
    badge: {
      type: String,
      trim: true,
      default: null,
    },
    icon: {
      type: String,
      trim: true,
      default: 'Wrench',
    },
    requiredCertifications: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
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

// Search and filtering indexes
serviceSchema.index({ name: 'text', description: 'text', tags: 'text' });
serviceSchema.index({ category: 1, activeStatus: 1 });
serviceSchema.index({ 'estimatedPrice.floorRate': 1, activeStatus: 1 });

export const Service = mongoose.model('Service', serviceSchema);

