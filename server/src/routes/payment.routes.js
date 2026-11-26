const router = require('express').Router();
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const S = require('../validators/domain.validators');
const c = require('../controllers/payment.controller');

// Public route (protected by Razorpay signature)
router.post('/webhook', c.webhook); 

// 👇 Protected routes 👇
// Pass the middleware directly into the route instead of using router.use()
router.post('/order', protect, authorize('customer'), validate(S.orderSchema), c.createOrder);
router.post('/verify', protect, authorize('customer'), validate(S.verifyPaymentSchema), c.verify);
router.get('/mine', protect, authorize('customer'), c.mine);

module.exports = router;