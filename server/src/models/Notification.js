const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['booking', 'application', 'refund', 'system'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, default: '', trim: true, maxlength: 300 },
    link: { type: String, default: '' }, // where a click should go, e.g. /admin/bookings
    entityId: { type: String, default: '' },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Old notifications delete themselves after 60 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);