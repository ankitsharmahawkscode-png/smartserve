const router = require('express').Router();

router.get('/health', (req, res) =>
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() }, message: 'SmartServe API is running' })
);

// Milestone 2+: router.use('/auth', require('./auth.routes'));
// router.use('/services', ...); router.use('/bookings', ...); router.use('/admin', ...);

module.exports = router;
