const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');
const { clientUrl, nodeEnv } = require('../config/env');

// ---- rate limiting (switched off in tests so they stay fast) ----
const limiter = ({ windowMs, limit, message = 'Too many attempts. Please try again later.', skip }) =>
  rateLimit({
    windowMs,
    limit,
    skip: (req) => nodeEnv === 'test' || (skip ? skip(req) : false),
    handler: (req, res, next) => next(new ApiError(429, message)),
  });

exports.limiter = limiter;
exports.apiLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 600, message: 'Too many requests. Please try again later.' });
exports.authLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 30 });
exports.refreshLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 60 });
exports.strictLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 10 });
exports.writeLimiter = limiter({
  windowMs: 5 * 60 * 1000,
  limit: 120,
  message: 'Too many requests. Please slow down.',
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.originalUrl.startsWith('/api/v1/payments/webhook'),

});
exports.contactLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 5, message: 'Too many messages. Please try again later.' });
exports.contactLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 5, message: 'Too many messages. Please try again later.' });
exports.resetLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 10, message: 'Too many reset requests. Please try again later.' });
// ---- MongoDB operator injection ----
// Keys such as "$ne" or "a.b" never appear in legitimate requests, so refuse them outright.
const forbidden = (key) => key.startsWith('$') || key.includes('.');
function hasForbiddenKeys(value, depth = 0) {
  if (depth > 10) return true;
  if (Array.isArray(value)) return value.some((v) => hasForbiddenKeys(v, depth + 1));
  if (value && typeof value === 'object') {
    return Object.keys(value).some((k) => forbidden(k) || hasForbiddenKeys(value[k], depth + 1));
  }
  return false;
}
exports.rejectOperatorKeys = (req, res, next) => {
  if (req.originalUrl.startsWith('/api/v1/payments/webhook')) return next(); // provider payload, verified by signature
  if ([req.query, req.body, req.params].some((part) => part && hasForbiddenKeys(part))) {
    return next(new ApiError(400, 'Invalid request'));
  }
  return next();
};

// ---- CSRF defence for cookie-authenticated endpoints ----
// The refresh cookie is sent cross-site in production (SameSite=None), so refuse requests whose
// Origin header names any site other than our own frontend. Non-browser clients send no Origin.
exports.requireTrustedOrigin = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin !== clientUrl) return next(new ApiError(403, 'Request origin not allowed'));
  return next();
};

// API responses can contain personal data, so never let browsers or proxies cache them.
exports.noStore = (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};