const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true, 
      trim: true 
    },
    discountType: { 
      type: String, 
      enum: ['percentage', 'flat'], 
      required: true 
    },
    discountValue: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    minBookingAmount: { 
      type: Number, 
      default: 0 
    },
    expiryDate: { 
      type: Date, 
      required: true 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    usageLimit: { 
      type: Number, 
      default: 100 
    },
    usedCount: { 
      type: Number, 
      default: 0 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);