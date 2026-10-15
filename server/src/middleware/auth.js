const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccess } = require('../utils/tokens');
const User = require('../models/User');

// Verifies the Bearer token, then loads the user so that deactivation, role changes and
// password changes take effect immediately (role comes from the DB, not from the token).
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyAccess(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found or deactivated');
  if ((payload.tv || 0) !== (user.tokenVersion || 0)) throw new ApiError(401, 'Session expired. Please log in again.');
  req.user = user;
  next();
});

// authorize('admin'), authorize('technician', 'admin')
exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : next(new ApiError(403, 'You do not have access to this resource'));