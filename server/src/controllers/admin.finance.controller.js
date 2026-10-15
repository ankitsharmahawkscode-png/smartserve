const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { paging, pageOf } = require('../utils/paginate');
const { logAudit } = require('../utils/audit');
const paymentService = require('../services/payment.service');

exports.listPayments = asyncHandler(async (req, res) => {
  const { status, provider, refundDue } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (provider) filter.provider = provider;
  if (refundDue === 'true') {
    filter.status = 'paid';
    filter.booking = { $in: await Booking.find({ paymentStatus: 'refund_pending' }).distinct('_id') };
  }
  const p = paging(req.query, 20);
  const [items, total] = await Promise.all([
    Payment.find(filter).sort('-createdAt').skip(p.skip).limit(p.limit)
      .populate({ path: 'booking', select: 'bookingNo status paymentStatus cancellation' })
      .populate('customer', 'name email'),
    Payment.countDocuments(filter),
  ]);
  ok(res, pageOf(items, total, p));
});

exports.refund = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found');
  ok(res, { payment: await paymentService.refundPayment(payment, req.user) }, 'Refund processed');
});

exports.listReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.hidden === 'true' || req.query.hidden === 'false') filter.isHidden = req.query.hidden === 'true';
  const p = paging(req.query, 20);
  const [items, total] = await Promise.all([
    Review.find(filter).sort('-createdAt').skip(p.skip).limit(p.limit)
      .populate('customer', 'name email').populate('service', 'name').populate('booking', 'bookingNo').populate('technician', 'name'),
    Review.countDocuments(filter),
  ]);
  ok(res, pageOf(items, total, p));
});

exports.setReviewHidden = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { isHidden: req.body.isHidden }, { new: true });
  if (!review) throw new ApiError(404, 'Review not found');
  await logAudit(req.user, req.body.isHidden ? 'review.hide' : 'review.unhide', 'Review', review._id);
  ok(res, { review }, req.body.isHidden ? 'Review hidden' : 'Review visible');
});