const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const seoRoutes = require('../utils/seo.routes');

// 👇 Import all route files at the top 👇
const publicRoutes = require('./public.routes');
const authRoutes = require('./auth.routes');
const meRoutes = require('./me.routes');
const bookingRoutes = require('./booking.routes');
const paymentRoutes = require('./payment.routes');
const reviewRoutes = require('./review.routes');
const adminRoutes = require('./admin.routes');
const technicianRoutes = require('./technician.routes');
const passwordRoutes = require('./password.routes');
const corporateRoutes = require('./corporateRoutes');
const giftCardRoutes = require('./giftCardRoutes');
const shopRoutes = require('./shopRoutes'); // 👈 Make sure this is here

router.get('/health', (req, res) =>
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() }, message: 'SmartServe API is running' })
);

// 👇 Mount them 👇
router.use(publicRoutes);
router.use('/seo', seoRoutes);
router.use('/auth', authRoutes);
router.use('/me', protect, meRoutes);
router.use('/bookings', protect, authorize('customer'), bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', protect, authorize('customer'), reviewRoutes);
router.use('/admin', protect, authorize('admin'), adminRoutes);
router.use('/tech', protect, authorize('technician'), technicianRoutes);
router.use('/me', protect, passwordRoutes);
router.use('/corporate', corporateRoutes);
router.use('/gift-cards', giftCardRoutes);
router.use('/shop', shopRoutes);

module.exports = router;