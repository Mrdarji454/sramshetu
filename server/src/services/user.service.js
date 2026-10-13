import { User } from '../models/User.model.js';
import { Booking } from '../models/Booking.model.js';
import { BookingService } from './booking.service.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';
import { OtpService } from './otp.service.js';
import { inMemoryUsers } from './auth.service.js';

const defaultPreferences = () => ({ language: 'en' });

function safeProfile(user) {
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email || '',
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage || null,
    phoneVerified: Boolean(user.phoneVerified),
    emailVerified: Boolean(user.emailVerified),
    addresses: (user.savedAddresses || []).map(address => ({
      id: String(address._id || address.id),
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
      coordinates: address.coordinates || [],
      isDefault: Boolean(address.isDefault),
    })),
    preferences: {
      language: user.preferences?.language === 'hi' ? 'hi' : defaultPreferences().language,
    },
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

function normalizeProfileImage(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.length > 7_000_000) {
    throw new AppError('Profile photo must be 5 MB or smaller', 400);
  }
  if (!/^https?:\/\/\S+$/i.test(value) && !/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)) {
    throw new AppError('Profile photo must be a valid image', 400);
  }
  return value;
}

function normalizeAddress(input) {
  const label = String(input.label || '').trim();
  const street = String(input.street || '').trim();
  const city = String(input.city || '').trim();
  const state = String(input.state || '').trim();
  const pincode = String(input.pincode || '').trim();
  const landmark = String(input.landmark || '').trim();
  const coordinates = input.coordinates || [];

  if (!['Home', 'Work', 'Other'].includes(label)) throw new AppError('Address label must be Home, Work, or Other', 400);
  if (!street || !city || !state || !/^[1-9][0-9]{5}$/.test(pincode)) throw new AppError('Street, city, state, and a valid 6-digit pincode are required', 400);
  if (!Array.isArray(coordinates) || (coordinates.length !== 0 && coordinates.length !== 2)) throw new AppError('Coordinates must be [longitude, latitude]', 400);
  if (coordinates.length === 2 && (!coordinates.every(value => Number.isFinite(Number(value))) || Math.abs(Number(coordinates[0])) > 180 || Math.abs(Number(coordinates[1])) > 90)) {
    throw new AppError('Coordinates must be valid longitude and latitude values', 400);
  }

  return { label, street, city, state, pincode, landmark, coordinates: coordinates.map(Number) };
}

function paymentStatusOf(booking) {
  return String(booking.paymentStatus || 'unknown').trim().toLowerCase();
}

function recordAmount(booking) {
  const amount = Number(booking.price?.totalAmount ?? booking.escrowAmount ?? 0);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export class UserService {
  static async getProfile(userId) {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return safeProfile(user);
    }
    const user = inMemoryUsers.get(String(userId));
    if (!user) throw new AppError('User not found', 404);
    return safeProfile(user);
  }

  static async updateProfile(userId, updates) {
    const isConnected = mongoose.connection.readyState === 1;
    const user = isConnected
      ? await User.findById(userId)
      : inMemoryUsers.get(String(userId));
    if (!user) throw new AppError('User not found', 404);
    const profileImage = updates.profileImage === undefined
      ? undefined
      : normalizeProfileImage(updates.profileImage);

    const email = updates.email === undefined ? undefined : String(updates.email).trim().toLowerCase();
    const phone = updates.phone === undefined ? undefined : String(updates.phone).trim();
    const emailChanged = email !== undefined && email !== (user.email || '');
    const phoneChanged = phone !== undefined && phone !== user.phone;

    if (emailChanged) {
      throw new AppError('Verify the email address using the email verification code before changing it', 403);
    }

    if (phoneChanged) {
      if (!OtpService.isPhoneVerified(phone)) throw new AppError('Verify the new phone number via OTP before saving it', 403);
      const duplicate = isConnected
        ? await User.findOne({ phone, _id: { $ne: userId } })
        : [...new Set(inMemoryUsers.values())].find(candidate => String(candidate._id || candidate.id) !== String(userId) && candidate.phone === phone);
      if (duplicate) throw new AppError('A user with this phone number is already registered', 409);
    }

    if (updates.name !== undefined) user.name = String(updates.name).trim();
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (phoneChanged) {
      user.phone = phone;
      user.phoneVerified = true;
    }
    if (updates.preferences) {
      user.preferences = {
        ...(user.preferences || defaultPreferences()),
        ...(updates.preferences.language ? { language: updates.preferences.language } : {}),
      };
    }

    if (isConnected) await user.save();
    if (phoneChanged) OtpService.consumePhoneVerification(phone);
    return safeProfile(user);
  }

  static async verifyCurrentPhone(userId) {
    const user = await this.getMutableUser(userId);
    if (!OtpService.isPhoneVerified(user.phone)) {
      throw new AppError('Verify this phone number using its OTP before confirming it', 403);
    }
    user.phoneVerified = true;
    if (mongoose.connection.readyState === 1) await user.save();
    OtpService.consumePhoneVerification(user.phone);
    return safeProfile(user);
  }

  static async addAddress(userId, input) {
    const address = normalizeAddress(input);
    const user = await this.getMutableUser(userId);
    const isDefault = !user.savedAddresses?.length;
    if (mongoose.connection.readyState === 1) {
      user.savedAddresses.push({ ...address, isDefault });
      await user.save();
      return safeProfile(user).addresses.at(-1);
    }
    const saved = { ...address, _id: new mongoose.Types.ObjectId().toString(), isDefault };
    user.savedAddresses ||= [];
    user.savedAddresses.push(saved);
    return safeProfile(user).addresses.at(-1);
  }

  static async updateAddress(userId, addressId, input) {
    const address = normalizeAddress(input);
    const user = await this.getMutableUser(userId);
    const saved = this.findAddress(user, addressId);
    if (!saved) throw new AppError('Saved address not found', 404);
    Object.assign(saved, address);
    if (mongoose.connection.readyState === 1) await user.save();
    return safeProfile(user).addresses.find(item => item.id === String(saved._id || saved.id));
  }

  static async deleteAddress(userId, addressId) {
    const user = await this.getMutableUser(userId);
    const addresses = user.savedAddresses || [];
    const index = addresses.findIndex(item => String(item._id || item.id) === String(addressId));
    if (index < 0) throw new AppError('Saved address not found', 404);
    const wasDefault = Boolean(addresses[index].isDefault);
    if (mongoose.connection.readyState === 1) user.savedAddresses.splice(index, 1);
    else addresses.splice(index, 1);
    if (wasDefault && addresses.length) addresses[0].isDefault = true;
    if (mongoose.connection.readyState === 1) await user.save();
    return safeProfile(user).addresses;
  }

  static async setDefaultAddress(userId, addressId) {
    const user = await this.getMutableUser(userId);
    const saved = this.findAddress(user, addressId);
    if (!saved) throw new AppError('Saved address not found', 404);
    for (const address of user.savedAddresses) address.isDefault = String(address._id || address.id) === String(addressId);
    if (mongoose.connection.readyState === 1) await user.save();
    return safeProfile(user).addresses;
  }

  static async getVault(userId) {
    const bookings = await BookingService.getBookings({ userId, role: 'USER' });
    const transactions = bookings.map(booking => {
      const paymentStatus = paymentStatusOf(booking);
      const providerPayment = booking.paymentProvider || {};
      const providerConfirmed = Boolean(providerPayment.confirmedAt && providerPayment.transactionId);
      const method = providerPayment.method || {};
      const last4 = String(method.last4 || '');
      const maskedPaymentMethod = providerConfirmed && /^\d{4}$/.test(last4)
        ? {
          providerName: String(method.providerName || method.brand || 'Payment provider'),
          last4,
        }
        : null;
      const providerRefunded = providerConfirmed &&
        ['refunded', 'refund_succeeded', 'processed'].includes(String(providerPayment.refundStatus || providerPayment.status).toLowerCase());
      const amount = recordAmount(booking);
      return {
        bookingId: String(booking._id || booking.id),
        bookingReference: String(booking.id || booking._id).slice(-8),
        bookingStatus: String(booking.status || 'PENDING').toUpperCase(),
        service: booking.serviceName || booking.trade || 'Service booking',
        bookingDate: booking.createdAt || null,
        updatedAt: booking.updatedAt || null,
        amount,
        currency: booking.price?.currency || 'INR',
        paymentStatus,
        paymentId: booking.paymentRecord ? String(booking.paymentRecord) : null,
        razorpayOrderId: providerPayment.orderId || null,
        razorpayPaymentId: providerPayment.transactionId || null,
        refundStatus: booking.refundStatus || providerPayment.refundStatus || 'not_applicable',
        paymentMethod: maskedPaymentMethod
          ? `${maskedPaymentMethod.providerName} ···· ${maskedPaymentMethod.last4}`
          : booking.paymentMethod || (providerPayment.provider === 'cash' ? 'CASH' : providerPayment.provider === 'razorpay' ? 'RAZORPAY' : null),
        maskedPaymentMethod,
        providerConfirmed,
        providerConfirmedAt: providerConfirmed ? providerPayment.confirmedAt : null,
        providerState: providerConfirmed ? providerPayment.status : null,
        escrowState: ['held', 'escrow_locked', 'released'].includes(paymentStatus) ? paymentStatus : null,
        refundState: providerRefunded ? 'confirmed' : null,
        refundConfirmedAt: providerRefunded ? providerPayment.refundConfirmedAt || null : null,
        invoiceUrl: providerConfirmed ? providerPayment.invoiceUrl || null : null,
      };
    });
    const sum = entries => entries.reduce((total, entry) => total + entry.amount, 0);
    const paymentMethods = [...new Map(
      transactions
        .filter(item => item.maskedPaymentMethod)
        .map(item => [
          `${item.maskedPaymentMethod.providerName}:${item.maskedPaymentMethod.last4}`,
          { id: `${item.maskedPaymentMethod.providerName}:${item.maskedPaymentMethod.last4}`, ...item.maskedPaymentMethod },
        ]),
    ).values()];

    return {
      providerIntegrationAvailable: Boolean(process.env.RAZORPAY_KEY_ID),
      paymentMethods,
      summary: {
        paidAmount: sum(transactions.filter(item => item.providerConfirmed && ['paid', 'captured', 'succeeded', 'released'].includes(String(item.providerState).toLowerCase()))),
        pendingAmount: sum(transactions.filter(item => ['pending', 'work_completed', 'payment_pending', 'cash_pending', 'cash_received'].includes(item.paymentStatus) && item.bookingStatus !== 'CANCELLED')),
        refundAmount: sum(transactions.filter(item => item.refundState === 'confirmed')),
        escrow: transactions.reduce((result, item) => {
          if (item.escrowState) result[item.escrowState] = (result[item.escrowState] || 0) + item.amount;
          return result;
        }, {}),
      },
      transactions,
    };
  }

  static async changePassword(userId, currentPassword, newPassword) {
    if (mongoose.connection.readyState !== 1) throw new AppError('Password changes require persistent account storage', 503);
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);
    if (!await user.comparePassword(currentPassword)) throw new AppError('Current password is incorrect', 400);
    user.password = newPassword;
    await user.save();
    return { changed: true };
  }

  static async getMutableUser(userId) {
    const user = mongoose.connection.readyState === 1
      ? await User.findById(userId)
      : inMemoryUsers.get(String(userId));
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  static findAddress(user, addressId) {
    return (user.savedAddresses || []).find(item => String(item._id || item.id) === String(addressId));
  }

  static async getBookings(userId) {
    return BookingService.getBookings({
      userId,
      role: 'USER',
    });
  }
}

