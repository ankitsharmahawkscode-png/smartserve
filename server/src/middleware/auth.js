const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { jwt: cfg } = require('../config/env');

// Verifies the Bearer access token and attaches { id, role } to req.user.
exports.protect = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Authentication required'));
  try {
    req.user = jwt.verify(token, cfg.accessSecret);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

// Role gate: authorize('admin'), authorize('technician', 'admin')
exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(new ApiError(403, 'You do not have access to this resource'));
