const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { paging, pageOf } = require('../utils/paginate');
const svc = require('../services/payment.service');
const razorpay = require('../services/razorpay.service');

exports.createOrder = asyncHandler(async (req, res) => {
  ok(res, await svc.createOrder(req.user, req.body.bookingId), 'Order created');
});

exports.verify = asyncHandler(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  const payment = await svc.verifyPayment(req.user, { orderId, paymentId, signature });
  ok(res, { payment }, 'Payment verified');
});

exports.mine = asyncHandler(async (req, res) => {
  const p = paging(req.query);
  const filter = { customer: req.user._id, status: { $in: ['paid', 'refunded'] } };
  const [items, total] = await Promise.all([
    Payment.find(filter).sort('-createdAt').skip(p.skip).limit(p.limit).populate({ path: 'booking', select: 'bookingNo service paymentStatus', populate: { path: 'service', select: 'name' } }),
    Payment.countDocuments(filter),
  ]);
  ok(res, pageOf(items, total, p));
});

// Public endpoint called by Razorpay. Trusted only if the signature on the raw body is valid.
exports.webhook = asyncHandler(async (req, res) => {
  if (!razorpay.verifyWebhook(req.rawBody ? req.rawBody.toString('utf8') : '', req.headers['x-razorpay-signature'])) {
    throw new ApiError(400, 'Invalid webhook signature');
  }
  await svc.handleWebhook(req.body);
  res.json({ success: true, data: { received: true }, message: 'OK' });
});