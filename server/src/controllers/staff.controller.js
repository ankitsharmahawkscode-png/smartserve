const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');
const { PERMISSIONS } = require('../config/permissions');

const shape = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  isActive: u.isActive,
  isSuperAdmin: !!u.isSuperAdmin,
  permissions: u.permissions || [],
  createdAt: u.createdAt,
  lastLoginAt: u.lastLoginAt || null,
});

const findStaff = async (id) => {
  const user = await User.findOne({ _id: id, role: 'admin' });
  if (!user) throw new ApiError(404, 'Staff member not found');
  if (user.isSuperAdmin) throw new ApiError(403, 'A super admin cannot be changed here');
  return user;
};

exports.list = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'admin' }).sort({ isSuperAdmin: -1, createdAt: 1 });
  ok(res, { items: users.map(shape), permissionOptions: PERMISSIONS });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, phone, password, permissions } = req.body;
  if (await User.findOne({ email })) {
    throw new ApiError(409, 'An account with this email already exists');
  }
  const user = await User.create({
    name,
    email,
    phone: phone || undefined,
    role: 'admin',
    isSuperAdmin: false,
    permissions: [...new Set(permissions || [])],
    passwordHash: await User.hashPassword(password),
  });
  ok(res, { staff: shape(user) }, 'Staff member created', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const user = await findStaff(req.params.id);
  const { name, phone, permissions, isActive } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone || undefined;
  if (permissions !== undefined) user.permissions = [...new Set(permissions)];
  if (isActive !== undefined) {
    user.isActive = isActive;
    if (!isActive) user.tokenVersion = (user.tokenVersion || 0) + 1; // signs them out
  }
  await user.save();
  ok(res, { staff: shape(user) }, 'Staff member updated');
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const user = await findStaff(req.params.id);
  user.passwordHash = await User.hashPassword(req.body.password);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.refreshTokens = [];
  user.failedLogins = 0;
  user.lockUntil = undefined;
  await user.save();
  ok(res, null, 'Password changed');
});