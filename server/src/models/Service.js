const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 2000 },
    basePrice: { type: Number, required: true, min: 0 },
    pricingType: { type: String, enum: ['fixed', 'estimate'], default: 'estimate' },
    durationMins: { type: Number, min: 15, default: 60 },
    isAvailable: { type: Boolean, default: true },
    image: { type: String, trim: true },
  },
  { timestamps: true }
);
schema.index({ category: 1, isAvailable: 1 });

module.exports = mongoose.model('Service', schema);