const mongoose = require('mongoose');

const { Schema } = mongoose;
const STATUSES = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const addressSnapshot = new Schema(
  { label: String, line1: { type: String, required: true }, line2: String, city: { type: String, required: true }, state: String, pincode: { type: String, required: true } },
  { _id: false }
);
const historySchema = new Schema(
  { from: String, to: String, by: { type: Schema.Types.ObjectId, ref: 'User' }, at: { type: Date, default: Date.now }, note: String },
  { _id: false }
);

const schema = new Schema(
  {
    bookingNo: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    technician: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD (IST)
    slot: { type: String, required: true }, // "14:00-16:00"
    address: { type: addressSnapshot, required: true }, // snapshot: later edits to saved addresses don't change old bookings
    notes: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: STATUSES, default: 'PENDING' },
    estimatedPrice: { type: Number, required: true, min: 0 },
    finalPrice: { type: Number, min: 0 },
    paymentMethod: { type: String, enum: ['online', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refund_pending', 'refunded'], default: 'unpaid' },
    // true while a technician is committed to this date+slot (ASSIGNED/ACCEPTED/IN_PROGRESS)
    holdsSlot: { type: Boolean, default: false },
    cancellation: { by: { type: Schema.Types.ObjectId, ref: 'User' }, role: String, reason: String, fee: Number, at: Date },
    statusHistory: [historySchema],
    liveLocation: {
  lat: { type: Number },
  lng: { type: Number },
  updatedAt: { type: Date },
  isSharing: { type: Boolean, default: false },
},
locationHistory: [
  {
    lat: Number,
    lng: Number,
    at: { type: Date, default: Date.now },
  },
],
  },
  { timestamps: true }
);

// The database itself prevents one technician from holding two jobs in the same slot.
schema.index({ technician: 1, date: 1, slot: 1 }, { unique: true, partialFilterExpression: { holdsSlot: true } });
schema.index({ customer: 1, createdAt: -1 });
schema.index({ technician: 1, status: 1 });
schema.index({ date: 1, slot: 1, status: 1 });
schema.index({ status: 1, createdAt: -1 });

schema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.holdsSlot;
    delete ret.__v;
    return ret;
  },
});
schema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Booking', schema);