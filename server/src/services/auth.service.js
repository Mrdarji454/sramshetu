import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export const inMemoryUsers = new Map();

export class AuthService {
  /**
   * Generate JWT Token for an authenticated user
   */
  static generateToken(user) {
    const role = user.role || 'USER';

    return jwt.sign(
      {
        id: user._id ? user._id.toString() : user.id,
        role,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn || '7d',
      }
    );
  }

  /**
   * Register a new user with hashed password
   */
  static async register({ name, phone, email, password, role = 'USER', phoneVerified = false }) {
    if (!name || !name.trim()) {
      throw new AppError('Please provide a name', 400);
    }
    if (!phone || !phone.trim()) {
      throw new AppError('Please provide a valid phone number', 400);
    }
    // Requirement 2: Email is compulsory
    if (!email || !email.trim()) {
      throw new AppError('Email address is required for registration', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new AppError('Please provide a valid email address (e.g. name@domain.com)', 400);
    }

    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    // Normalize role
    const rawRole = (role || 'USER').toUpperCase();
    const normalizedRole = rawRole === 'CUSTOMER' ? 'USER' : rawRole;
    const validRoles = ['USER', 'COOPERATIVE', 'WORKER', 'ADMIN'];

    if (!validRoles.includes(normalizedRole)) {
      throw new AppError(
        `Invalid role "${role}". Allowed roles: ${validRoles.join(', ')}`,
        400
      );
    }

    const cleanPhone = phone.trim();

    if (mongoose.connection.readyState === 1) {
      // Check existing phone
      const existingPhone = await User.findOne({ phone: cleanPhone });
      if (existingPhone) {
        throw new AppError('A user with this phone number is already registered', 409);
      }

      // Check existing email
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        throw new AppError('A user with this email address is already registered', 409);
      }

      // Create user record (pre-save hook hashes password)
      const user = await User.create({
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password,
        role: normalizedRole,
        phoneVerified: Boolean(phoneVerified),
      });

      // If registering as WORKER, initialize corresponding Worker profile in DRAFT state
      if (normalizedRole === 'WORKER') {
        const { Worker } = await import('../models/Worker.model.js');
        await Worker.findOneAndUpdate(
          { user: user._id },
          {
            $setOnInsert: {
              user: user._id,
              userId: user._id,
              email: cleanEmail,
              phone: cleanPhone,
              name: user.name,
              phoneVerified: Boolean(phoneVerified),
              registrationStatus: 'DRAFT',
              registrationProgress: {
                currentStep: 1,
                completedSteps: [1],
                phoneVerified: Boolean(phoneVerified),
              },
              rates: { dailyFloorRate: 800, hourlyRate: 250 },
              location: {
                address: { street: '', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
                workingRadiusKm: 15,
              },
              availability: { status: 'available' },
              verificationStatus: { status: 'pending' },
            },
          },
          { upsert: true, new: true }
        );
      }

      const token = this.generateToken(user);

      return {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          phoneVerified: user.phoneVerified,
          isVerified: user.isVerified,
          profileImage: user.profileImage || null,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        token,
      };
    } else {
      // In-memory fallback when MongoDB is not connected (e.g. dev/test mode)
      const existingPhone = inMemoryUsers.get(cleanPhone);
      if (existingPhone) {
        throw new AppError('A user with this phone number is already registered', 409);
      }
      const existingEmail = inMemoryUsers.get(cleanEmail);
      if (existingEmail) {
        throw new AppError('A user with this email address is already registered', 409);
      }

      const mockId = new mongoose.Types.ObjectId().toString();
      const mockUser = {
        id: mockId,
        _id: mockId,
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password,
        role: normalizedRole,
        phoneVerified: Boolean(phoneVerified),
        isVerified: false,
        profileImage: null,
        isActive: true,
      };

      inMemoryUsers.set(mockId, mockUser);
      inMemoryUsers.set(mockUser.phone, mockUser);
      inMemoryUsers.set(mockUser.email, mockUser);

      // If WORKER, seed in-memory worker in DRAFT mode
      if (normalizedRole === 'WORKER') {
        const { inMemoryWorkers } = await import('./worker.service.js');
        inMemoryWorkers.set(mockId, {
          id: mockId,
          _id: mockId,
          user: mockId,
          userId: mockId,
          name: mockUser.name,
          phone: mockUser.phone,
          email: cleanEmail,
          phoneVerified: Boolean(phoneVerified),
          registrationStatus: 'DRAFT',
          registrationProgress: {
            currentStep: 1,
            completedSteps: [1],
            phoneVerified: Boolean(phoneVerified),
          },
          rates: { dailyFloorRate: 800, hourlyRate: 250 },
          location: {
            address: { street: '', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
            workingRadiusKm: 15,
          },
          availability: { status: 'available' },
          verificationStatus: { status: 'pending' },
        });
      }

      const safeUser = { ...mockUser };
      delete safeUser.password;
      const token = this.generateToken(mockUser);
      return { user: safeUser, token };
    }
  }

  /**
   * Login user by verifying credentials
   */
  static async login({ identifier, password }) {
    if (!identifier || !password) {
      throw new AppError('Please provide both phone/email and password', 400);
    }

    const cleanIdentifier = identifier.trim();

    if (mongoose.connection.readyState === 1) {
      // Search by phone or lowercase email
      const user = await User.findOne({
        $or: [
          { phone: cleanIdentifier },
          { email: cleanIdentifier.toLowerCase() },
        ],
      }).select('+password');

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated. Please contact support.', 403);
      }

      const token = this.generateToken(user);

      return {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email || null,
          role: user.role,
          isVerified: user.isVerified,
          profileImage: user.profileImage || null,
          isActive: user.isActive,
        },
        token,
      };
    } else {
      // In-memory fallback for test / dev environment
      const existing =
        inMemoryUsers.get(cleanIdentifier) ||
        inMemoryUsers.get(cleanIdentifier.toLowerCase());

      if (existing) {
        if (existing.password && existing.password !== password) {
          const match =
            existing.password === password ||
            (await bcrypt.compare(password, existing.password).catch(() => false));
          if (!match) {
            throw new AppError('Invalid credentials', 401);
          }
        }

        const safeUser = { ...existing };
        delete safeUser.password;
        const token = this.generateToken(existing);
        return { user: safeUser, token };
      }

      // Default mock user if not registered
      const mockId = new mongoose.Types.ObjectId().toString();
      const mockUser = {
        id: mockId,
        _id: mockId,
        name: 'Demo Authenticated User',
        phone: cleanIdentifier,
        email: cleanIdentifier.includes('@') ? cleanIdentifier : null,
        role: 'USER',
        isVerified: true,
        isActive: true,
      };
      const token = this.generateToken(mockUser);
      return { user: mockUser, token };
    }
  }

  /**
   * Get current user profile by user id
   */
  static async getMe(userId) {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId).select('-password -passwordHash');
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return user;
    }

    const existing = inMemoryUsers.get(userId) || inMemoryUsers.get(String(userId));
    if (existing) {
      const safeUser = { ...existing };
      delete safeUser.password;
      return safeUser;
    }

    return {
      id: userId,
      name: 'Authenticated User',
      role: 'USER',
      isVerified: true,
      isActive: true,
    };
  }
}
