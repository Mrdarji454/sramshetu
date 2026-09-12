import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export class AuthService {
  /**
   * Generate JWT Token for an authenticated user
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        role: user.role,
        name: user.name,
        phone: user.phone,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );
  }

  /**
   * Register a new user with hashed password
   */
  static async register({ name, phone, email, password, role = 'user' }) {
    // Validate role is one of the 4 supported roles
    const validRoles = ['user', 'worker', 'cooperative', 'admin'];
    if (!validRoles.includes(role)) {
      throw new AppError(`Invalid role "${role}". Allowed roles: ${validRoles.join(', ')}`, 400);
    }

    if (mongoose.connection.readyState === 1) {
      // Check existing phone
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        throw new AppError('A user with this phone number is already registered', 409);
      }

      // Check existing email if provided
      if (email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          throw new AppError('A user with this email address is already registered', 409);
        }
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user record
      const user = await User.create({
        name,
        phone,
        email,
        passwordHash,
        role,
      });

      const token = this.generateToken(user);
      return {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
      };
    } else {
      // Mocked response when DB is not connected
      const mockId = new mongoose.Types.ObjectId();
      const mockUser = {
        id: mockId,
        _id: mockId,
        name,
        phone,
        email,
        role,
        isVerified: false,
      };
      const token = this.generateToken(mockUser);
      return { user: mockUser, token };
    }
  }

  /**
   * Login user by verifying credentials
   */
  static async login({ identifier, password }) {
    if (!identifier || !password) {
      throw new AppError('Please provide both phone/email and password', 400);
    }

    if (mongoose.connection.readyState === 1) {
      // Search by phone or email
      const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
      }).select('+passwordHash');

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
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
      };
    } else {
      // Mocked response for test / dev environment
      const mockUser = {
        id: new mongoose.Types.ObjectId(),
        name: 'Demo Authenticated User',
        phone: identifier,
        role: 'user',
        isVerified: true,
      };
      const token = this.generateToken(mockUser);
      return { user: mockUser, token };
    }
  }
}

