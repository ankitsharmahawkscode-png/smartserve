const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'image', trim: true, maxlength: 120 },
    contentType: { type: String, required: true, enum: ['image/jpeg', 'image/png', 'image/svg+xml'] },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);