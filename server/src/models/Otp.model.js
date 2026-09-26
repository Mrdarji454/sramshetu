import mongoose from 'mongoose';

/**
 * OTP Model — stores hashed one-time passwords for phone verification.
 *
 * TTL index on `expiresAt` automatically deletes expired documents
 * so the collection never grows unbounded.
 */
const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /** SHA-256 hash of "phone:otp:shramsetu_otp_salt" — never stored in plain text */
    otpHash: {
      type: String,
      required: true,
    },

    /** Number of failed verification attempts (max 3 before invalidation) */
    attempts: {
      type: Number,
      default: 0,
    },

    /** Timestamp of the most recent send — used to enforce the 30-second resend cooldown */
    lastSentAt: {
      type: Date,
      default: Date.now,
    },

    /** MongoDB TTL index: document is auto-deleted once this date passes */
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // 0 = delete at the exact expiresAt timestamp
    },
  },
  {
    timestamps: true,
    collection: 'otps',
  }
);

export const Otp = mongoose.model('Otp', otpSchema);

export default Otp;

