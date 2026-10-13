import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    // `booking` and `customer` remain for compatibility with existing queries;
    // the explicit *Id fields are the canonical payment audit references.
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cooperative', default: null, index: true },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null, select: false },
    gatewayKeyId: { type: String, default: null },
    mode: { type: String, enum: ['test', 'live'], default: 'test' },
    verifiedVia: { type: String, enum: ['checkout', 'gateway'], default: null },
    gatewayPaymentStatus: { type: String, enum: ['authorized', 'captured'], default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    paymentMethod: { type: String, enum: ['RAZORPAY', 'CASH'], default: null, index: true },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'WORK_COMPLETED', 'PAYMENT_PENDING', 'CASH_PENDING', 'CASH_RECEIVED', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING',
        index: true,
    },
    // Legacy mirror retained so older dashboard code can read the record.
    status: { type: String, default: 'PENDING', index: true },
    statusHistory: [{ status: String, at: { type: Date, default: Date.now }, actor: mongoose.Schema.Types.ObjectId }],
    orderCreationState: { type: String, enum: ['idle', 'creating'], default: 'idle' },
    refundStatus: { type: String, enum: ['not_applicable', 'pending', 'processed', 'failed'], default: 'not_applicable' },
    razorpayRefundId: { type: String, default: null },
    refundRequestedAt: { type: Date, default: null },
    refundFailureReason: { type: String, default: null },
    failureReason: { type: String, default: null },
    paidAt: { type: Date, default: null },
    cashReceivedAt: { type: Date, default: null },
    cashReceivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    receiptId: { type: String, default: null },
    releasedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    invoiceNumber: { type: String, default: null },
    invoiceIssuedAt: { type: Date, default: null },
}, { timestamps: true });

paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true, partialFilterExpression: { razorpayOrderId: { $type: 'string' } } });
paymentSchema.index({ razorpayPaymentId: 1 }, { unique: true, partialFilterExpression: { razorpayPaymentId: { $type: 'string' } } });

export const Payment = mongoose.model('Payment', paymentSchema);
