const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwt: cfg } = require('../config/env');

// tv = the user's tokenVersion. Bumping it (for example on a password change) instantly
// invalidates every access token issued before, on every device.
exports.signAccess = (user) =>
  jwt.sign({ id: user.id, role: user.role, tv: user.tokenVersion || 0 }, cfg.accessSecret, { expiresIn: cfg.accessExpires });

// jti makes every refresh token unique, even when issued in the same second.
exports.signRefresh = (user) =>
  jwt.sign({ id: user.id, jti: crypto.randomUUID() }, cfg.refreshSecret, { expiresIn: cfg.refreshExpires });

exports.verifyAccess = (t) => jwt.verify(t, cfg.accessSecret);
exports.verifyRefresh = (t) => jwt.verify(t, cfg.refreshSecret);
exports.hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// Password-reset links carry a random token; only its SHA-256 hash is stored.
exports.newResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: exports.hashToken(token) };
};