const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const seoRoutes = require('../utils/seo.routes');

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
const shopRoutes = require('./shopRoutes');

router.get('/health', (req, res) => res.json({ success: true }));

console.log("1. Loading Public");
router.use(publicRoutes);

console.log("2. Loading SEO");
router.use('/seo', seoRoutes);

console.log("3. Loading Auth");
router.use('/auth', authRoutes);

console.log("4. Loading Me");
router.use('/me', protect, meRoutes);

console.log("5. Loading Bookings");
router.use('/bookings', protect, authorize('customer'), bookingRoutes);

console.log("6. Loading Payments");
router.use('/payments', paymentRoutes); // <--- We know it crashes around here

console.log("7. Loading Reviews");
router.use('/reviews', protect, authorize('customer'), reviewRoutes);

console.log("8. Loading Admin");
router.use('/admin', protect, authorize('admin'), adminRoutes);

console.log("9. Loading Tech");
router.use('/tech', protect, authorize('technician'), technicianRoutes);

console.log("10. Loading Password");
router.use('/me', protect, passwordRoutes);

console.log("11. Loading Corporate");
router.use('/corporate', corporateRoutes);

console.log("12. Loading Gift Cards");
router.use('/gift-cards', giftCardRoutes);

console.log("13. Loading Shop");
router.use('/shop', shopRoutes);

module.exports = router;