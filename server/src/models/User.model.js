import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'worker', 'cooperative', 'admin'],
        message: '{VALUE} is not a supported ShramSetu role',
      },
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    cooperativeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify password candidate against bcrypt hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);

