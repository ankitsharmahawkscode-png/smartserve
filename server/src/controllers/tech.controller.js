const Booking = require('../models/Booking');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { paging, pageOf } = require('../utils/paginate');
const svc = require('../services/booking.service');

const view = [
  { path: 'customer', select: 'name phone' },
  { path: 'service', select: 'name pricingType' },
];

// A technician only ever sees jobs where technician === themselves.
const findMine = async (req) => {
  const job = await Booking.findOne({ _id: req.params.id, technician: req.user._id });
  if (!job) throw new ApiError(404, 'Job not found');
  return job;
};

exports.listJobs = asyncHandler(async (req, res) => {
  const history = req.query.scope === 'history';
  const filter = {
    technician: req.user._id,
    status: { $in: history ? ['COMPLETED', 'CANCELLED'] : ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
  };
  const p = paging(req.query);
  const sort = history ? { date: -1, slot: -1 } : { date: 1, slot: 1 };
  const [items, total] = await Promise.all([
    Booking.find(filter).sort(sort).skip(p.skip).limit(p.limit).populate(view),
    Booking.countDocuments(filter),
  ]);
  ok(res, pageOf(items, total, p));
});

exports.getJob = asyncHandler(async (req, res) => {
  const job = await findMine(req);
  ok(res, { booking: await job.populate(view) });
});

exports.respond = asyncHandler(async (req, res) => {
  const job = await findMine(req);
  const booking = await svc.respondToJob(job, req.user, req.body.accept, req.body.reason);
  ok(res, { booking }, req.body.accept ? 'Job accepted' : 'Job rejected');
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const job = await findMine(req);
  const booking = await svc.advanceJob(job, req.user, req.body.status, req.body.finalPrice);
  ok(res, { booking }, 'Job updated');
});

exports.setAvailability = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $set: { 'technician.isAvailable': req.body.isAvailable } }, { new: true });
  ok(res, { user }, 'Availability updated');
});