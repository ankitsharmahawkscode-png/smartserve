const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { paging, pageOf } = require('../utils/paginate');
const svc = require('../services/booking.service');

const view = [
  { path: 'service', select: 'name pricingType' },
  { path: 'technician', select: 'name phone' },
];

exports.create = asyncHandler(async (req, res) => {
  const booking = await svc.createBooking(req.user, req.body);
  ok(res, { booking }, 'Booking created', 201);
});

exports.list = asyncHandler(async (req, res) => {
  const p = paging(req.query);
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = String(req.query.status).toUpperCase();
  const [items, total] = await Promise.all([
    Booking.find(filter).sort('-createdAt').skip(p.skip).limit(p.limit).populate(view),
    Booking.countDocuments(filter),
  ]);
  ok(res, pageOf(items, total, p));
});

// Always scoped to the logged-in customer: someone else's booking looks like "not found".
exports.getOne = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id }).populate(view);
  if (!booking) throw new ApiError(404, 'Booking not found');
  ok(res, { booking });
});

exports.cancel = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found');
  const updated = await svc.cancelBooking(booking, req.user, req.body.reason);
  const fee = updated.cancellation.fee;
  ok(res, { booking: updated }, fee ? `Booking cancelled. A cancellation fee of Rs ${fee} applies.` : 'Booking cancelled');
});