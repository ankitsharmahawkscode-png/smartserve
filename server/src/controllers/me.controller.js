const { isProd, cookieSameSite } = require('../config/env');
const { logAudit } = require('../utils/audit');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');

const clearDefaults = (userId) => User.updateOne({ _id: userId }, { $set: { 'addresses.$[].isDefault': false } });

exports.get = (req, res) => ok(res, { user: req.user });

exports.update = asyncHandler(async (req, res) => {
  if (!Object.keys(req.body).length) throw new ApiError(400, 'Nothing to update');
  const user = await User.findByIdAndUpdate(req.user._id, { $set: req.body }, { new: true, runValidators: true });
  ok(res, { user }, 'Profile updated');
});

exports.addAddress = asyncHandler(async (req, res) => {
  const isDefault = Boolean(req.body.isDefault) || req.user.addresses.length === 0;
  if (isDefault) await clearDefaults(req.user._id);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { addresses: { ...req.body, isDefault } } },
    { new: true, runValidators: true }
  );
  ok(res, { user }, 'Address added', 201);
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const set = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [`addresses.$.${k}`, v]));
  if (!Object.keys(set).length) throw new ApiError(400, 'Nothing to update');
  if (req.body.isDefault) await clearDefaults(req.user._id);
  const user = await User.findOneAndUpdate(
    { _id: req.user._id, 'addresses._id': req.params.addressId },
    { $set: set },
    { new: true, runValidators: true }
  );
  if (!user) throw new ApiError(404, 'Address not found');
  ok(res, { user }, 'Address updated');
});

exports.removeAddress = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.user._id, 'addresses._id': req.params.addressId },
    { $pull: { addresses: { _id: req.params.addressId } } },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'Address not found');
  ok(res, { user }, 'Address removed');
});
// Changing the password signs the user out everywhere: refresh tokens are wiped and
// tokenVersion is bumped, so every access token issued before this moment stops working.
exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.verifyPassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  await User.updateOne(
    { _id: user._id },
    { $set: { passwordHash: await User.hashPassword(req.body.newPassword), refreshTokens: [] }, $inc: { tokenVersion: 1 } }
  );
  await logAudit(user, 'auth.password_change', 'User', user._id);
  res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: cookieSameSite, path: '/api/v1/auth' });
  ok(res, null, 'Password changed. Please log in again.');
});
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 72 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least 8 characters, a letter and a number',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};