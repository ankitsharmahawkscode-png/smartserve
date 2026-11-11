const crypto = require('crypto');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

const MAX_TRIES = 5;
const FRESH_MS = 5 * 60 * 1000;

// ---- Customer: GET /bookings/:id/tracking ----
exports.tracking = asyncHandler(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, customer: req.user._id })
    .select('+startCode')
    .populate('technician', 'name phone');
  if (!b) throw new ApiError(404, 'Booking not found');

  // Create the start code as soon as the technician accepts
  let code = b.startCode;
  if (b.status === 'ACCEPTED' && !code) {
    await Booking.updateOne(
      { _id: b._id, startCode: { $exists: false } },
      { $set: { startCode: String(crypto.randomInt(1000, 10000)) } }
    );
    code = (await Booking.findById(b._id).select('+startCode')).startCode;
  }

  const showTech = b.technician && ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status);
  const loc = b.liveLocation;
  const showLoc =
    b.onTheWayAt && !b.arrivedAt && ['ACCEPTED', 'IN_PROGRESS'].includes(b.status) && loc && loc.lat != null;

  ok(res, {
    tracking: {
      status: b.status,
      onTheWayAt: b.onTheWayAt || null,
      arrivedAt: b.arrivedAt || null,
      technician: showTech ? { name: b.technician.name, phone: b.technician.phone || '' } : null,
      location: showLoc
        ? { lat: loc.lat, lng: loc.lng, at: loc.at, stale: Date.now() - new Date(loc.at).getTime() > FRESH_MS }
        : null,
      startCode: b.status === 'ACCEPTED' ? code || null : null, // hidden once the job starts
    },
  });
});

// ---- Technician: POST /tech/jobs/:id/location/ping ----
exports.ping = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  const r = await Booking.updateOne(
    { _id: req.params.id, technician: req.user._id, status: { $in: ['ACCEPTED', 'IN_PROGRESS'] } },
    { $set: { liveLocation: { lat, lng, at: new Date() } } }
  );
  if (!(r.matchedCount ?? r.n)) throw new ApiError(404, 'Job not found');
  ok(res, null, 'Location updated');
});

// ---- Technician: POST /tech/jobs/:id/progress ----
exports.progress = asyncHandler(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, technician: req.user._id }).select(
    'status onTheWayAt arrivedAt'
  );
  if (!b) throw new ApiError(404, 'Job not found');
  if (b.status !== 'ACCEPTED') throw new ApiError(400, 'Accept the job before you start travelling');

  if (req.body.step === 'on_the_way') {
    await Booking.updateOne(
      { _id: b._id },
      { $set: { onTheWayAt: b.onTheWayAt || new Date() }, $unset: { arrivedAt: '' } }
    );
    return ok(res, null, 'The customer can now see you on the way');
  }

  await Booking.updateOne(
    { _id: b._id },
    { $set: { onTheWayAt: b.onTheWayAt || new Date(), arrivedAt: b.arrivedAt || new Date() } }
  );
  ok(res, null, 'Marked as arrived');
});

// ---- Middleware: the job can only start with the customer's code ----
exports.requireStartCode = asyncHandler(async (req, res, next) => {
  if (req.body?.status !== 'IN_PROGRESS') return next();

  const b = await Booking.findOne({ _id: req.params.id, technician: req.user._id }).select(
    '+startCode +startCodeTries'
  );
  if (!b || !b.startCode) return next(); // older bookings have no code, so nothing to check

  if ((b.startCodeTries || 0) >= MAX_TRIES) {
    throw new ApiError(429, 'Too many wrong codes. Please contact the admin.');
  }
  if (String(req.body.code || '').trim() !== b.startCode) {
    await Booking.updateOne({ _id: b._id }, { $inc: { startCodeTries: 1 } });
    throw new ApiError(400, 'Wrong start code. Ask the customer for the 4-digit code.');
  }
  next();
});