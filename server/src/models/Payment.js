const mongoose = require('mongoose');

const { Schema } = mongoose;
const schema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['razorpay', 'cash'], required: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, index: true },
    amount: { type: Number, required: true, min: 0 }, // rupees
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
    verifiedAt: Date,
    failureReason: String,
    refundId: String,
    refundAmount: Number,
    refundedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', schema);