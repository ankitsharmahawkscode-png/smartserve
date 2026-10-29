module.exports = (requiredPermission) => {
  return (req, res, next) => {
    // 1. Check if user is logged in and is an admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access Denied. Admin only." });
    }

    // 2. Super Admin gets a free pass to everything
    if (req.user.isSuperAdmin) {
      return next();
    }

    // 3. Check if Sub-Admin has the specific permission
    // Using optional chaining in case permissions array is empty/undefined
    if (req.user.permissions && req.user.permissions.includes(requiredPermission)) {
      return next();
    }

    // 4. Block if no permission
    return res.status(403).json({ success: false, message: `Access Denied. You don't have permission for ${requiredPermission}.` });
  };
};