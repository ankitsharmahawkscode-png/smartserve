const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signAccess, signRefresh, verifyRefresh, hashToken, newResetToken } = require('../utils/tokens');
const { isProd, bcryptRounds, cookieSameSite } = require('../config/env');
const { logAudit } = require('../utils/audit');
const email = require('../services/email.service');
const { clientUrl, appName, nodeEnv } = require('../config/env');

const COOKIE = 'refreshToken';

// ✅ Cookie Options correctly defined
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

const clearCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: cookieSameSite,
  path: '/'
};

// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', bcryptRounds);

async function startSession(user, res) {
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  
  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: { $each: [hashToken(refreshToken)], $slice: -5 } } }
  );

  res.cookie(COOKIE, refreshToken, cookieOptions);
  
  return accessToken;
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
  
  const user = await User.create({ name, email, phone, passwordHash: await User.hashPassword(password), role: 'customer' });
  const accessToken = await startSession(user, res);
  
  res.status(201).json({ success: true, data: { user, accessToken }, message: 'Registration successful' });
});

const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;
const LOGIN_ERROR = 'Invalid email or password. After several failed attempts an account is locked for 15 minutes.';

async function registerFailedLogin(user) {
  const updated = await User.findOneAndUpdate({ _id: user._id }, { $inc: { failedLogins: 1 } }, { new: true }).select('+failedLogins');
  if (updated && updated.failedLogins >= MAX_FAILED_LOGINS) {
    const until = new Date(Date.now() + LOCK_MS);
    await User.updateOne({ _id: user._id }, { $set: { failedLogins: 0, lockUntil: until } });
    await logAudit(user, 'auth.lockout', 'User', user._id, { until });
  }
}

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash +failedLogins +lockUntil');
  const locked = Boolean(user && user.lockUntil && user.lockUntil > new Date());
  
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  
  if (!user || locked || !ok) {
    if (user && !locked) await registerFailedLogin(user);
    throw new ApiError(401, LOGIN_ERROR);
  }
  
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated. Please contact support.');

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date(), failedLogins: 0 }, $unset: { lockUntil: 1 } });
  const accessToken = await startSession(user, res);
  
  res.json({ success: true, data: { user, accessToken }, message: 'Login successful' });
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies[COOKIE];
  if (!token) throw new ApiError(401, 'No session');

  let payload;
  try {
    payload = verifyRefresh(token);
  } catch {
    res.clearCookie(COOKIE, clearCookieOptions);
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const hash = hashToken(token);
  const user = await User.findOneAndUpdate(
    { _id: payload.id, refreshTokens: hash },
    { $pull: { refreshTokens: hash } },
    { new: true }
  );
  
  if (!user) {
    await User.updateOne({ _id: payload.id }, { $set: { refreshTokens: [] } });
    res.clearCookie(COOKIE, clearCookieOptions);
    throw new ApiError(401, 'Session expired. Please log in again.');
  }
  
  if (!user.isActive) {
    res.clearCookie(COOKIE, clearCookieOptions);
    throw new ApiError(401, 'Account not found or deactivated');
  }
  
  const accessToken = await startSession(user, res);
  res.json({ success: true, data: { user, accessToken }, message: 'Token refreshed' });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies[COOKIE];
  if (token) {
    try {
      const { id } = verifyRefresh(token);
      await User.updateOne({ _id: id }, { $pull: { refreshTokens: hashToken(token) } });
    } catch { /* already invalid, nothing to revoke */ }
  }
  res.clearCookie(COOKIE, clearCookieOptions);
  res.json({ success: true, data: null, message: 'Logged out' });
});

exports.me = (req, res) => res.json({ success: true, data: { user: req.user }, message: 'OK' });

const RESET_MS = 60 * 60 * 1000;
const FORGOT_MESSAGE = 'If an account exists for that email, we have sent a link to reset the password.';

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, isActive: true });
  if (user) {
    const { token, hash } = newResetToken();
    await User.updateOne({ _id: user._id }, { $set: { resetTokenHash: hash, resetTokenExpires: new Date(Date.now() + RESET_MS) } });
    const job = email
      .send({
        to: user.email,
        subject: `${appName}: reset your password`,
        text: `Hi ${user.name},\n\nUse this link to choose a new password. It works once and expires in 1 hour:\n${clientUrl}/reset-password?token=${token}\n\nIf you did not ask for this, ignore this email. Your password stays the same.`,
      })
      .catch((e) => console.error('Reset email failed:', e.message));
    if (nodeEnv === 'test') await job;
  }
  res.json({ success: true, data: null, message: FORGOT_MESSAGE });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const valid = { resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() }, isActive: true };
  
  if (!(await User.exists(valid))) throw new ApiError(400, 'This reset link is invalid or has expired. Please request a new one.');
  
  const user = await User.findOneAndUpdate(
    valid,
    {
      $set: { passwordHash: await User.hashPassword(newPassword), refreshTokens: [], failedLogins: 0 },
      $unset: { resetTokenHash: 1, resetTokenExpires: 1, lockUntil: 1 },
      $inc: { tokenVersion: 1 },
    },
    { new: true }
  );
  
  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired. Please request a new one.');
  await logAudit(user, 'auth.password_reset', 'User', user._id);
  res.json({ success: true, data: null, message: 'Password updated. You can now log in.' });
});