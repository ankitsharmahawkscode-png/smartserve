const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const seoRoutes = require('../utils/seo.routes');


router.get('/health', (req, res) =>
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() }, message: 'SmartServe API is running' })
);

router.use(require('./public.routes'));
router.use('/seo', seoRoutes);
router.use('/auth', require('./auth.routes'));
router.use('/me', protect, require('./me.routes'));
router.use('/bookings', protect, authorize('customer'), require('./booking.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/reviews', protect, authorize('customer'), require('./review.routes'));
router.use('/admin', protect, authorize('admin'), require('./admin.routes'));
router.use('/tech', protect, authorize('technician'), require('./technician.routes'));

module.exports = router;