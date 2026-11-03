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

    // 👇 NAYE FIELDS SUPER ADMIN & PERMISSIONS KE LIYE 👇
    isSuperAdmin: { type: Boolean, default: false },
    permissions: { type: [String], default: [] },
    // 👆 Example: ['blogs', 'categories', 'bookings']

    isActive: { type: Boolean, default: true },
    addresses: [addressSchema],
    refreshTokens: { type: [String], select: false, default: [] },
    lastLoginAt: Date,
    failedLogins: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    tokenVersion: { type: Number, default: 0 },
    resetTokenHash: { type: String, select: false, index: true, sparse: true },
    resetTokenExpires: { type: Date, select: false },

    // 👇 AUTHOR PROFILE (Admin Profile page + public author page) 👇
    profile: {
      slug: { type: String, lowercase: true, trim: true, maxlength: 60 }, // no default on purpose
      designation: { type: String, default: '', trim: true, maxlength: 80 },
      workplace: { type: String, default: '', trim: true, maxlength: 100 },
      location: { type: String, default: '', trim: true, maxlength: 100 },
      avatar: { type: String, default: '' },
      about: { type: [String], default: [] },
      social: {
        linkedin: { type: String, default: '', trim: true },
        twitter: { type: String, default: '', trim: true },
        facebook: { type: String, default: '', trim: true },
        instagram: { type: String, default: '', trim: true },
        website: { type: String, default: '', trim: true },
      },
    },

    technician: {
      skills: [String],
      isAvailable: { type: Boolean, default: true },
      commissionPct: { type: Number, min: 0, max: 100, default: 0 },
    },
  },
  { timestamps: true }
);

// Author slugs must be unique, but only users who set one are checked
// (everyone else has no slug, so a plain unique index would clash on "null").
userSchema.index(
  { 'profile.slug': 1 },
  { unique: true, partialFilterExpression: { 'profile.slug': { $type: 'string' } } }
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