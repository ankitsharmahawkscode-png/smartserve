const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { bcryptRounds } = require('../config/env');

const ROLES = ['customer', 'technician', 'admin'];

const addressSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 30 },
  line1: { type: String, required: true, trim: true, maxlength: 150 },
  line2: { type: String, trim: true, maxlength: 150 },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer', index: true },
    isActive: { type: Boolean, default: true },
    addresses: [addressSchema],
    // SHA-256 hashes of valid refresh tokens (one per device, newest 5 kept)
    refreshTokens: { type: [String], select: false, default: [] },
    lastLoginAt: Date,
    // Technician-only fields (used from Milestone 3 onward)
        failedLogins: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    tokenVersion: { type: Number, default: 0 },
        resetTokenHash: { type: String, select: false, index: true, sparse: true },
    resetTokenExpires: { type: Date, select: false },
    technician: {
      skills: [String],
      isAvailable: { type: Boolean, default: true },
      commissionPct: { type: Number, min: 0, max: 100, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.statics.ROLES = ROLES;
userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, bcryptRounds);
userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Never leak secrets in API responses.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.refreshTokens;  
      delete ret.failedLogins;
    delete ret.lockUntil;
    delete ret.tokenVersion;
        delete ret.resetTokenHash;
    delete ret.resetTokenExpires;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);