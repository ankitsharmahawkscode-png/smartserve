const router = require('express').Router();
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const S = require('../validators/domain.validators');
const c = require('../controllers/payment.controller');

router.post('/webhook', c.webhook); // public, protected by the Razorpay signature instead

router.use(protect, authorize('customer'));
router.post('/order', validate(S.orderSchema), c.createOrder);
router.post('/verify', validate(S.verifyPaymentSchema), c.verify);
router.get('/mine', c.mine);

module.exports = router;