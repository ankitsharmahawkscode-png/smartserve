const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { paging, pageOf } = require('../utils/paginate');
const { logAudit } = require('../utils/audit');

exports.create = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const booking = await Booking.findOne({ _id: bookingId, customer: req.user._id }); // only your own bookings
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== 'COMPLETED') throw new ApiError(409, 'You can review a booking once it is completed');
  if (await Review.exists({ booking: booking._id })) throw new ApiError(409, 'You have already reviewed this booking');
  let review;
  try {
    review = await Review.create({ booking: booking._id, customer: req.user._id, technician: booking.technician, service: booking.service, rating, comment });
  } catch (e) {
    if (e.code === 11000) throw new ApiError(409, 'You have already reviewed this booking');
    throw e;
  }
  await logAudit(req.user, 'review.create', 'Review', review._id, { booking: booking._id, rating });
  ok(res, { review }, 'Thank you for your review', 201);
});

exports.mine = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ customer: req.user._id }).sort('-createdAt').populate('service', 'name').populate('booking', 'bookingNo');
  const pending = await Booking.find({ customer: req.user._id, status: 'COMPLETED', _id: { $nin: reviews.map((r) => r.booking._id) } })
    .sort('-updatedAt').limit(50).populate('service', 'name');
  ok(res, { reviews, pending });
});

const firstName = (name = '') => name.split(' ')[0];

// Public: visible reviews and the average rating for a service.
exports.forService = asyncHandler(async (req, res) => {
  const filter = { service: req.params.id, isHidden: false };
  const p = paging(req.query, 10);
  const [items, total, agg] = await Promise.all([
    Review.find(filter).sort('-createdAt').skip(p.skip).limit(p.limit).populate('customer', 'name'),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { service: new mongoose.Types.ObjectId(req.params.id), isHidden: false } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
  ]);
  const mapped = items.map((r) => ({ _id: r._id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, author: firstName(r.customer?.name) }));
  ok(res, { ...pageOf(mapped, total, p), summary: { average: agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0, count: agg[0]?.count || 0 } });
});