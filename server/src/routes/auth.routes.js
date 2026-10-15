const router = require('express').Router();
const c = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter, refreshLimiter, resetLimiter, requireTrustedOrigin } = require('../middleware/security');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/auth.validators');

router.post('/register', authLimiter, validate(registerSchema), c.register);
router.post('/login', authLimiter, validate(loginSchema), c.login);
router.post('/forgot-password', resetLimiter, validate(forgotPasswordSchema), c.forgotPassword);
router.post('/reset-password', resetLimiter, validate(resetPasswordSchema), c.resetPassword);
router.post('/refresh', requireTrustedOrigin, refreshLimiter, c.refresh);
router.post('/logout', requireTrustedOrigin, c.logout);
router.get('/me', protect, c.me);

module.exports = router;