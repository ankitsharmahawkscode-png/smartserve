const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

const shape = (u) => {
  const p = u.profile || {};
  const s = p.social || {};
  return {
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    slug: p.slug || '',
    designation: p.designation || '',
    workplace: p.workplace || '',
    location: p.location || '',
    avatar: p.avatar || '',
    about: p.about || [],
    social: {
      linkedin: s.linkedin || '',
      twitter: s.twitter || '',
      facebook: s.facebook || '',
      instagram: s.instagram || '',
      website: s.website || '',
    },
  };
};

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');
  ok(res, { profile: shape(user) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, slug, designation, workplace, location, avatar, about, social } = req.body;

  const taken = await User.findOne({ 'profile.slug': slug, _id: { $ne: req.user._id } });
  if (taken) throw new ApiError(409, 'This author slug is already taken');

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name, phone: phone || '', profile: { slug, designation, workplace, location, avatar, about, social } } },
    { new: true, runValidators: true }
  );
  ok(res, { profile: shape(user) }, 'Profile updated');
});