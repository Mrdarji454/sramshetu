import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { EmailVerification } from '../models/EmailVerification.model.js';
import { User } from '../models/User.model.js';
import { inMemoryUsers } from './auth.service.js';
import { AppError } from '../utils/AppError.js';

const challenges = new Map();
const CODE_TTL_MS = 10 * 60 * 1000;
const SEND_COOLDOWN_MS = 30 * 1000;
const SEND_WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS = 5;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function hashCode(userId, email, code) {
    return crypto.createHmac('sha256', config.jwt.secret)
        .update(`${userId}:${email}:${code}`)
        .digest('hex');
}

function equalHash(left, right) {
    const leftBuffer = Buffer.from(left || '', 'hex');
    const rightBuffer = Buffer.from(right || '', 'hex');
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function smtpReady() {
    return Boolean(config.email.smtpHost && config.email.smtpUser && config.email.smtpPassword && config.email.from);
}

async function deliverVerificationEmail({ to, code }) {
    if (!smtpReady()) {
        throw new AppError('Email verification is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM.', 503);
    }
    const transporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: config.email.smtpSecure,
        auth: { user: config.email.smtpUser, pass: config.email.smtpPassword },
    });
    await transporter.sendMail({
        from: config.email.from,
        to,
        subject: 'Verify your ShramSetu email address',
        text: `Your ShramSetu email verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    });
}

async function findUser(userId) {
    if (mongoose.connection.readyState === 1) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);
        return user;
    }
    const user = inMemoryUsers.get(String(userId));
    if (!user) throw new AppError('User not found', 404);
    return user;
}

async function assertEmailAvailable(email, userId) {
    const duplicate = mongoose.connection.readyState === 1
        ? await User.findOne({ email, _id: { $ne: userId } })
        : [...new Set(inMemoryUsers.values())].find(user => String(user._id || user.id) !== String(userId) && user.email?.toLowerCase() === email);
    if (duplicate) throw new AppError('A user with this email address is already registered', 409);
}

export class EmailVerificationService {
    static async request(userId, rawEmail, deliver = deliverVerificationEmail) {
        const email = normalizeEmail(rawEmail);
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email)) {
            throw new AppError('Please provide a valid email address', 400);
        }
        if (deliver === deliverVerificationEmail && !smtpReady()) {
            throw new AppError('Email verification is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM.', 503);
        }

        const user = await findUser(userId);
        if (user.email === email && user.emailVerified) return { email, alreadyVerified: true };
        await assertEmailAvailable(email, userId);

        const now = Date.now();
        const key = String(userId);
        let previous = mongoose.connection.readyState === 1
            ? await EmailVerification.findOne({ user: userId })
            : challenges.get(key);
        if (previous && now - new Date(previous.lastSentAt).getTime() < SEND_COOLDOWN_MS) {
            throw new AppError('Please wait before requesting another email code', 429);
        }
        const windowStart = previous && now - new Date(previous.windowStartedAt || previous.lastSentAt).getTime() < SEND_WINDOW_MS
            ? new Date(previous.windowStartedAt || previous.lastSentAt).getTime()
            : now;
        const sentCount = windowStart === now ? 1 : (previous.sentCount || 1) + 1;
        if (sentCount > MAX_SENDS) throw new AppError('Too many email verification requests. Try again later.', 429);

        const code = crypto.randomInt(100000, 1000000).toString();
        const record = {
            user: userId,
            email,
            codeHash: hashCode(userId, email, code),
            attempts: 0,
            sentCount,
            windowStartedAt: new Date(windowStart),
            lastSentAt: new Date(now),
            expiresAt: new Date(now + CODE_TTL_MS),
        };
        if (mongoose.connection.readyState === 1) {
            await EmailVerification.findOneAndUpdate({ user: userId }, { $set: record }, { upsert: true, new: true });
        } else {
            challenges.set(key, record);
        }

        try {
            await deliver({ to: email, code });
        } catch (error) {
            if (mongoose.connection.readyState === 1) await EmailVerification.deleteOne({ user: userId });
            else challenges.delete(key);
            throw error instanceof AppError ? error : new AppError('Unable to send the verification email. Check SMTP settings and try again.', 503);
        }

        return { email, expiresInSeconds: CODE_TTL_MS / 1000 };
    }

    static async verify(userId, rawEmail, rawCode) {
        const email = normalizeEmail(rawEmail);
        const code = String(rawCode || '').trim();
        if (!/^\d{6}$/.test(code)) throw new AppError('Enter the 6-digit email verification code', 400);

        const key = String(userId);
        const record = mongoose.connection.readyState === 1
            ? await EmailVerification.findOne({ user: userId }).select('+codeHash')
            : challenges.get(key);
        if (!record || record.email !== email) throw new AppError('No active verification code for this email address', 400);
        if (Date.now() > new Date(record.expiresAt).getTime()) {
            if (mongoose.connection.readyState === 1) await EmailVerification.deleteOne({ user: userId });
            else challenges.delete(key);
            throw new AppError('Email verification code expired. Request a new code.', 400);
        }
        if (!equalHash(record.codeHash, hashCode(userId, email, code))) {
            if (mongoose.connection.readyState === 1) {
                if ((record.attempts || 0) + 1 >= MAX_ATTEMPTS) await EmailVerification.deleteOne({ user: userId });
                else await EmailVerification.updateOne({ user: userId }, { $inc: { attempts: 1 } });
            } else if ((record.attempts || 0) + 1 >= MAX_ATTEMPTS) {
                challenges.delete(key);
            } else {
                record.attempts = (record.attempts || 0) + 1;
            }
            throw new AppError('Invalid email verification code', 400);
        }

        const user = await findUser(userId);
        await assertEmailAvailable(email, userId);
        const previousEmail = user.email;
        user.email = email;
        user.emailVerified = true;
        if (mongoose.connection.readyState === 1) await user.save();
        else {
            inMemoryUsers.delete(previousEmail);
            inMemoryUsers.set(email, user);
        }
        if (mongoose.connection.readyState === 1) await EmailVerification.deleteOne({ user: userId });
        else challenges.delete(key);
        return { email, emailVerified: true };
    }
}

export default EmailVerificationService;
