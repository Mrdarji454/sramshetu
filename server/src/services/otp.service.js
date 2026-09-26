import crypto from 'crypto';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { Otp } from '../models/Otp.model.js';

// In-memory store for dev/testing when MongoDB is not connected
const otpStore = new Map();
const verifiedPhones = new Map(); // phone -> { verifiedAt, expiresAt }
const rateLimitStore = new Map(); // phone -> { count, windowStart }

const COOLDOWN_SECONDS = 30;
const EXPIRY_SECONDS = 300; // 5 minutes
const MAX_ATTEMPTS = 3;
const MAX_REQUESTS_PER_WINDOW = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const VERIFICATION_VALIDITY_MS = 15 * 60 * 1000; // 15 minutes to finish registration

/**
 * Standardize phone number to 10-digit Indian mobile number
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  return digits.slice(-10);
};

export const isValidIndianPhone = (phone) => {
  const normalized = normalizePhone(phone);
  return /^[6-9]\d{9}$/.test(normalized);
};

const hashOtp = (phone, otp) => {
  return crypto.createHash('sha256').update(`${phone}:${otp}:shramsetu_otp_salt`).digest('hex');
};

export class OtpService {
  /**
   * Generate 6-digit cryptographic numeric OTP
   */
  static generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send OTP with 30s resend cooldown, 5-min expiry, rate-limiting & hash storage
   */
  static async sendOtp(phone) {
    const normalized = normalizePhone(phone);

    if (!normalized || !isValidIndianPhone(normalized)) {
      throw new AppError('Please provide a valid 10-digit Indian mobile number', 400);
    }

    const now = Date.now();

    // 1. Check Rate Limit (max 5 per 15 minutes)
    const rateRecord = rateLimitStore.get(normalized) || { count: 0, windowStart: now };
    if (now - rateRecord.windowStart > RATE_WINDOW_MS) {
      rateRecord.count = 0;
      rateRecord.windowStart = now;
    }
    if (rateRecord.count >= MAX_REQUESTS_PER_WINDOW) {
      const waitMinutes = Math.ceil((RATE_WINDOW_MS - (now - rateRecord.windowStart)) / 60000);
      throw new AppError(`Too many OTP requests. Please wait ${waitMinutes} minutes before requesting another OTP.`, 429);
    }

    // 2. Check 30-second Resend Cooldown
    let existingRecord = null;
    if (mongoose.connection.readyState === 1) {
      existingRecord = await Otp.findOne({ phone: normalized });
    } else {
      existingRecord = otpStore.get(normalized);
    }

    if (existingRecord) {
      const lastSentTime = existingRecord.lastSentAt ? new Date(existingRecord.lastSentAt).getTime() : 0;
      const elapsedSeconds = Math.floor((now - lastSentTime) / 1000);
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remaining = COOLDOWN_SECONDS - elapsedSeconds;
        throw new AppError(`Please wait ${remaining} seconds before requesting a new OTP.`, 429);
      }
    }

    // 3. Generate 6-digit OTP & Hash
    const otp = this.generateOtp();
    const otpHashed = hashOtp(normalized, otp);
    const expiresAt = new Date(now + EXPIRY_SECONDS * 1000);

    // 4. Persist OTP
    if (mongoose.connection.readyState === 1) {
      await Otp.findOneAndUpdate(
        { phone: normalized },
        {
          $set: {
            otpHash: otpHashed,
            attempts: 0,
            lastSentAt: new Date(now),
            expiresAt,
          },
        },
        { upsert: true, new: true }
      );
    } else {
      otpStore.set(normalized, {
        otpHash: otpHashed,
        plainOtp: otp, // In dev mode only
        attempts: 0,
        lastSentAt: now,
        expiresAt: expiresAt.getTime(),
      });
    }

    // Update rate limit counter
    rateRecord.count += 1;
    rateLimitStore.set(normalized, rateRecord);

    // In non-production or demo environment, log for easy testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP SERVICE] Verification OTP for ${normalized} is: ${otp}`);
    }

    return {
      success: true,
      phone: normalized,
      message: 'OTP sent successfully to your mobile number',
      expiresInSeconds: EXPIRY_SECONDS,
      cooldownSeconds: COOLDOWN_SECONDS,
      // For automated tests and developer convenience when running locally
      ...(process.env.NODE_ENV !== 'production' && { debugOtp: otp }),
    };
  }

  /**
   * Verify entered OTP (one-time use, max 3 attempts)
   */
  static async verifyOtp(phone, otp) {
    const normalized = normalizePhone(phone);
    const rawOtp = String(otp || '').trim();

    if (!normalized || !isValidIndianPhone(normalized)) {
      throw new AppError('Please provide a valid 10-digit Indian mobile number', 400);
    }

    if (!rawOtp || rawOtp.length !== 6) {
      throw new AppError('Please enter a valid 6-digit OTP', 400);
    }

    const now = Date.now();
    let record = null;

    if (mongoose.connection.readyState === 1) {
      record = await Otp.findOne({ phone: normalized });
    } else {
      record = otpStore.get(normalized);
    }

    if (!record) {
      throw new AppError('No OTP found for this mobile number or it has expired. Please request a new OTP.', 400);
    }

    const recordExpires = record.expiresAt instanceof Date ? record.expiresAt.getTime() : record.expiresAt;
    if (now > recordExpires) {
      if (mongoose.connection.readyState === 1) {
        await Otp.deleteOne({ phone: normalized });
      } else {
        otpStore.delete(normalized);
      }
      throw new AppError('This OTP has expired. Please request a new OTP.', 400);
    }

    const expectedHash = hashOtp(normalized, rawOtp);
    if (record.otpHash !== expectedHash) {
      const attempts = (record.attempts || 0) + 1;

      if (attempts >= MAX_ATTEMPTS) {
        if (mongoose.connection.readyState === 1) {
          await Otp.deleteOne({ phone: normalized });
        } else {
          otpStore.delete(normalized);
        }
        throw new AppError('Maximum invalid attempts reached. This OTP has been invalidated. Please request a new OTP.', 400);
      }

      if (mongoose.connection.readyState === 1) {
        await Otp.updateOne({ phone: normalized }, { $set: { attempts } });
      } else {
        record.attempts = attempts;
        otpStore.set(normalized, record);
      }

      const remainingAttempts = MAX_ATTEMPTS - attempts;
      throw new AppError(`Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`, 400);
    }

    // OTP is valid! Delete it immediately (one-time use)
    if (mongoose.connection.readyState === 1) {
      await Otp.deleteOne({ phone: normalized });
    } else {
      otpStore.delete(normalized);
    }

    // Mark phone as verified for registration
    verifiedPhones.set(normalized, {
      verifiedAt: now,
      expiresAt: now + VERIFICATION_VALIDITY_MS,
    });

    return {
      success: true,
      verified: true,
      phone: normalized,
      message: 'Mobile number verified successfully',
    };
  }

  /**
   * Check if phone has been verified by backend
   */
  static isPhoneVerified(phone) {
    const normalized = normalizePhone(phone);
    const record = verifiedPhones.get(normalized);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      verifiedPhones.delete(normalized);
      return false;
    }
    return true;
  }

  /**
   * Consume verification token after registration completes
   */
  static consumePhoneVerification(phone) {
    const normalized = normalizePhone(phone);
    verifiedPhones.delete(normalized);
    return true;
  }
}

export default OtpService;
