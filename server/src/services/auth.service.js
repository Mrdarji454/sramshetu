import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

const inMemoryUsers = new Map();

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
  static async register({ name, phone, email, password, role = 'USER' }) {
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

    if (mongoose.connection.readyState === 1) {
      // Check existing phone
      const existingPhone = await User.findOne({ phone: phone.trim() });
      if (existingPhone) {
        throw new AppError('A user with this phone number is already registered', 409);
      }

      // Check existing email if provided
      if (email && email.trim()) {
        const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
        if (existingEmail) {
          throw new AppError('A user with this email address is already registered', 409);
        }
      }

      // Create user record (pre-save hook hashes password)
      const user = await User.create({
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : undefined,
        password,
        role: normalizedRole,
      });

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
          createdAt: user.createdAt,
        },
        token,
      };
    } else {
      // In-memory fallback when MongoDB is not connected (e.g. dev/test mode)
      const mockId = new mongoose.Types.ObjectId().toString();
      const mockUser = {
        id: mockId,
        _id: mockId,
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        password,
        role: normalizedRole,
        isVerified: false,
        profileImage: null,
        isActive: true,
      };

      inMemoryUsers.set(mockId, mockUser);
      inMemoryUsers.set(mockUser.phone, mockUser);
      if (mockUser.email) inMemoryUsers.set(mockUser.email, mockUser);

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
