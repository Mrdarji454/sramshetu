import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
      index: true,
      alias: 'customerId',
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: [true, 'Worker reference is required'],
      index: true,
      alias: 'workerId',
    },
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      default: null,
      index: true,
      alias: 'cooperativeId',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      unique: true, // One review per booking
      index: true,
      alias: 'bookingId',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      index: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
      default: '',
    },
    aspectRatings: {
      punctuality: { type: Number, min: 1, max: 5 },
      craftsmanship: { type: Number, min: 1, max: 5 },
      behavior: { type: Number, min: 1, max: 5 },
      safetyCompliance: { type: Number, min: 1, max: 5 },
    },
    isPublic: {
      type: Boolean,
      default: true,
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

// High performance indexes
reviewSchema.index({ worker: 1, rating: -1, createdAt: -1 });
reviewSchema.index({ cooperative: 1, rating: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });

// Static method to recalculate worker rating
reviewSchema.statics.calcAverageRatings = async function (workerId) {
  try {
    const stats = await this.aggregate([
      { $match: { worker: workerId, isPublic: true } },
      {
        $group: {
          _id: '$worker',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const WorkerModel = mongoose.models.Worker;
    if (WorkerModel) {
      if (stats.length > 0) {
        await WorkerModel.findByIdAndUpdate(workerId, {
          'rating.count': stats[0].nRating,
          'rating.average': Math.round(stats[0].avgRating * 10) / 10,
        });
      } else {
        await WorkerModel.findByIdAndUpdate(workerId, {
          'rating.count': 0,
          'rating.average': 5.0,
        });
      }
    }
  } catch (err) {
    // Avoid crashing if database is not active or worker model not ready
    console.error('Error in calcAverageRatings hook:', err);
  }
};

// Post-save hook to recalculate rating
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.worker);
});

export const Review = mongoose.model('Review', reviewSchema);

