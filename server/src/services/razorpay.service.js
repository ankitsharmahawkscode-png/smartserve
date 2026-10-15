const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const { razorpay: cfg } = require('../config/env');

let client;
const sdk = () => {
  if (!cfg.enabled) throw new ApiError(503, 'Online payments are not configured');
  if (!client) {
    const Razorpay = require('razorpay');
    client = new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret });
  }
  return client;
};

// Provider errors are not Error instances, so convert them to a clean API error.
const call = async (fn) => {
  try {
    return await fn(sdk());
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(502, `Payment provider error: ${e?.error?.description || e?.message || 'unknown error'}`);
  }
};

const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

exports.isEnabled = () => cfg.enabled;
exports.keyId = () => cfg.keyId;
exports.createOrder = ({ amountPaise, receipt, notes }) =>
  call((r) => r.orders.create({ amount: amountPaise, currency: 'INR', receipt, notes }));
exports.fetchPayment = (paymentId) => call((r) => r.payments.fetch(paymentId));
exports.capture = (paymentId, amountPaise) => call((r) => r.payments.capture(paymentId, amountPaise, 'INR'));
exports.refund = (paymentId, amountPaise, notes) => call((r) => r.payments.refund(paymentId, { amount: amountPaise, notes }));

// Razorpay checkout signature: HMAC-SHA256("order_id|payment_id") with the key secret.
exports.verifySignature = (orderId, paymentId, signature) =>
  Boolean(cfg.keySecret) && safeEqual(hmac(cfg.keySecret, `${orderId}|${paymentId}`), signature);

// Webhook signature: HMAC-SHA256(raw request body) with the webhook secret.
exports.verifyWebhook = (rawBody, signature) =>
  Boolean(cfg.webhookSecret) && Boolean(rawBody) && safeEqual(hmac(cfg.webhookSecret, rawBody), signature);