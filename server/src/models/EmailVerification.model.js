import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    codeHash: { type: String, required: true, select: false },
    attempts: { type: Number, default: 0 },
    sentCount: { type: Number, default: 1 },
    windowStartedAt: { type: Date, default: Date.now },
    lastSentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true, collection: 'email_verifications' });

export const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);
export default EmailVerification;
