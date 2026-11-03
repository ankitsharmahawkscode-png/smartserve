const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// Reads the current rights from the database, so changes apply at once
const loadMe = async (req) => {
  if (!req._me) {
    req._me = await User.findById(req.user._id).select('role isSuperAdmin permissions isActive');
  }
  return req._me;
};

exports.requireSuperAdmin = async (req, res, next) => {
  try {
    const me = await loadMe(req);
    if (!me || !me.isActive || !me.isSuperAdmin) throw new ApiError(403, 'Only a super admin can do this');
    next();
  } catch (err) {
    next(err);
  }
};

exports.requirePermission = (key) => async (req, res, next) => {
  try {
    const me = await loadMe(req);
    if (!me || !me.isActive) throw new ApiError(403, 'Your account is not active');
    if (me.isSuperAdmin || (me.permissions || []).includes(key)) return next();
    throw new ApiError(403, 'You do not have access to this section');
  } catch (err) {
    next(err);
  }
};