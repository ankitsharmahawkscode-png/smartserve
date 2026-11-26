const mongoose = require('mongoose');
const crypto = require('crypto');

const giftCardSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  recipientName: { type: String, required: true, trim: true },
  recipientEmail: { type: String, required: true, trim: true, lowercase: true },
  senderEmail: { type: String, required: true, trim: true, lowercase: true },
  status: { 
    type: String, 
    enum: ['Active', 'Fully Redeemed', 'Expired', 'Cancelled'], 
    default: 'Active' 
  },
  paymentId: { type: String, required: true },
  expiresAt: { type: Date, default: () => new Date(+new Date() + 365*24*60*60*1000) }
}, { timestamps: true });

giftCardSchema.pre('save', function(next) {
  if (!this.code) {
    const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.code = `SS-GIFT-${randomStr}`;
  }
  next();
});

module.exports = mongoose.model('GiftCard', giftCardSchema);