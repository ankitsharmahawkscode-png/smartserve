const mongoose = require('mongoose');

const { Schema } = mongoose;
const schema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true }, // one review per booking
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    technician: { type: Schema.Types.ObjectId, ref: 'User' },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);
schema.index({ service: 1, isHidden: 1, createdAt: -1 });

module.exports = mongoose.model('Review', schema);