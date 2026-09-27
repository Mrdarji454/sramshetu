import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const savedAddressSchema = new mongoose.Schema({
  label: { type: String, enum: ['Home', 'Work', 'Other'], required: true },
  street: { type: String, trim: true, required: true, maxlength: 200 },
  city: { type: String, trim: true, required: true, maxlength: 100 },
  state: { type: String, trim: true, required: true, maxlength: 100 },
  pincode: { type: String, trim: true, required: true, match: /^[1-9][0-9]{5}$/ },
  landmark: { type: String, trim: true, maxlength: 200, default: '' },
  coordinates: {
    type: [Number],
    validate: {
      validator: value => value.length === 0 || (
        value.length === 2 && Number.isFinite(value[0]) && Number.isFinite(value[1]) &&
        Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90
      ),
      message: 'Coordinates must be [longitude, latitude]',
    },
    default: [],
  },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      sparse: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a valid phone number'],
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
      alias: 'passwordHash',
    },
    role: {
      type: String,
      enum: {
        values: [
          'USER',
          'COOPERATIVE',
          'WORKER',
          'ADMIN',
          'user',
          'cooperative',
          'worker',
          'admin',
          'customer',
        ],
        message: '{VALUE} is not a supported ShramSetu role',
      },
      default: 'USER',
      index: true,
    },
    profileImage: {
      type: String,
      default: null,
      alias: 'avatar',
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    cooperativeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      default: null,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    savedAddresses: { type: [savedAddressSchema], default: [] },
    preferences: {
      language: { type: String, enum: ['en', 'hi'], default: 'en' },
    },
    fcmTokens: [
      {
        token: String,
        platform: { type: String, enum: ['web', 'android', 'ios'] },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    lastLoginAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for frequent searches
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'address.city': 1, role: 1 });

// Pre-save hook: Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  // Avoid re-hashing if it's already a valid bcrypt hash
  if (typeof this.password === 'string' && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method: Verify candidate password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error('Password field not selected in query');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
