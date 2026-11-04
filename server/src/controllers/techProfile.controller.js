const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

const shape = (u) => {
  const t = u.technician || {};
  return {
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    city: t.city || '',
    bio: t.bio || '',
    experienceYears: t.experienceYears ?? 0,
    skills: [...(t.skills || [])],
    serviceAreas: [...(t.serviceAreas || [])],
    workingDays: [...(t.workingDays || [])],
    workStart: t.workStart || '09:00',
    workEnd: t.workEnd || '19:00',
    avatar: t.avatar || '',
    isAvailable: t.isAvailable ?? false,
    commissionPct: t.commissionPct ?? 0,
  };
};

// Each part is optional, so a missing Review model never breaks the page
const getStats = async (userId) => {
  const id = new mongoose.Types.ObjectId(String(userId));
  const out = { jobsCompleted: 0, rating: null, reviews: 0 };
  try {
    out.jobsCompleted = await Booking.countDocuments({ technician: id, status: 'COMPLETED' });
  } catch (e) { /* ignore */ }
  try {
    const Review = require('../models/Review'); // change the path if your model is named differently
    const [r] = await Review.aggregate([
      { $match: { technician: id, isHidden: { $ne: true } } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (r) {
      out.rating = Math.round(r.avg * 10) / 10;
      out.reviews = r.count;
    }
  } catch (e) { /* ignore */ }
  return out;
};

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');
  ok(res, { profile: shape(user), stats: await getStats(user._id) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');
  const b = req.body;

  // Only these fields can be changed here. Name, email, commission and
  // account status stay under the admin's control.
  user.phone = b.phone || undefined;
  user.technician.city = b.city;
  user.technician.bio = b.bio;
  user.technician.experienceYears = b.experienceYears;
  user.technician.skills = [...new Set(b.skills)];
  user.technician.serviceAreas = [...new Set(b.serviceAreas)];
  user.technician.workingDays = b.workingDays;
  user.technician.workStart = b.workStart;
  user.technician.workEnd = b.workEnd;
  user.technician.avatar = b.avatar;
  await user.save();

  ok(res, { profile: shape(user) }, 'Profile updated');
});

exports.setAvailability = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { 'technician.isAvailable': req.body.isAvailable } },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found');
  ok(res, { isAvailable: user.technician.isAvailable }, 'Availability updated');
});