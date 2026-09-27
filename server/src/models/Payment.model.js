import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null, select: false },
    gatewayKeyId: { type: String, required: true },
    mode: { type: String, enum: ['test', 'live'], default: 'test' },
    verifiedVia: { type: String, enum: ['checkout', 'gateway'], default: null },
    gatewayPaymentStatus: { type: String, enum: ['authorized', 'captured'], default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'failed', 'escrow_locked', 'released', 'refunded'], default: 'pending', index: true },
    refundStatus: { type: String, enum: ['not_applicable', 'pending', 'processed', 'failed'], default: 'not_applicable' },
    razorpayRefundId: { type: String, default: null },
    refundRequestedAt: { type: Date, default: null },
    refundFailureReason: { type: String, default: null },
    failureReason: { type: String, default: null },
    paidAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    invoiceNumber: { type: String, default: null },
    invoiceIssuedAt: { type: Date, default: null },
}, { timestamps: true });

paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ razorpayPaymentId: 1 }, { unique: true, partialFilterExpression: { razorpayPaymentId: { $type: 'string' } } });

export const Payment = mongoose.model('Payment', paymentSchema);
