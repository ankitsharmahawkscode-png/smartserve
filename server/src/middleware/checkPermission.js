const User = require('../models/User');

module.exports = (requiredPermission) => async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    // Read the current rights from the database, not from the login token
    const me = await User.findById(req.user._id).select('isSuperAdmin permissions isActive');
    if (!me || !me.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is not active.' });
    }

    if (me.isSuperAdmin || (me.permissions || []).includes(requiredPermission)) return next();

    return res.status(403).json({
      success: false,
      message: `Access denied. You don't have permission for ${requiredPermission}.`,
    });
  } catch (err) {
    next(err);
  }
};