const express = require('express');
const router = express.Router();
const { authLimiter, refreshLimiter, resetLimiter, requireTrustedOrigin } = require('../middleware/security');
const validate = require('../middleware/validate');
const S = require('../validators/domain.validators');
const authController = require('../controllers/auth.controller');

// Routes
router.post('/register', authLimiter, validate(S.registerSchema), authController.register);
router.post('/login', authLimiter, validate(S.loginSchema), authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', resetLimiter, validate(S.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', resetLimiter, validate(S.resetPasswordSchema), authController.resetPassword);
router.get('/me', authController.me);

module.exports = router;