const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash +refreshTokens');
  if (!user) throw new ApiError(404, 'User not found');

  // 400, not 401: a 401 would make the site think the login expired and sign the person out
  if (!(await user.verifyPassword(req.body.currentPassword))) {
    throw new ApiError(400, 'Your current password is wrong');
  }

  user.passwordHash = await User.hashPassword(req.body.newPassword);
  user.refreshTokens = [];                         // signs out every device
  user.tokenVersion = (user.tokenVersion || 0) + 1; // delete this line to keep the current login alive
  await user.save();

  ok(res, null, 'Password changed. Please log in again with your new password.');
});