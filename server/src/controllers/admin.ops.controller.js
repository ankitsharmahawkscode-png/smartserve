const Booking = require('../models/Booking');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { paging, pageOf } = require('../utils/paginate');
const { escapeRegex } = require('../utils/text');
const { SLOT_HOLDING } = require('../utils/bookingStatus');
const { getSettings, updateSettings } = require('../services/settings.service');
const svc = require('../services/booking.service');

const view = [
  { path: 'customer', select: 'name email phone' },
  { path: 'technician', select: 'name phone' },
  { path: 'service', select: 'name pricingType' },
];
const load = async (id) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  return booking;
};

// ----- bookings -----
exports.listBookings = asyncHandler(async (req, res) => {
  const { status, date, technician, q } = req.query;
  const filter = {};
  if (status) filter.status = String(status).toUpperCase();
  if (date) filter.date = String(date);
  if (technician) filter.technician = technician;
  if (q) filter.bookingNo = new RegExp(escapeRegex(String(q)), 'i');
  const p = paging(req.query, 20);
  const [items, total] = await Promise.all([
    Booking.find(filter).sort('-createdAt').skip(p.skip).limit(p.limit).populate(view),
    Booking.countDocuments(filter),
  ]);
  ok(res, pageOf(items, total, p));
});

exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(view);
  if (!booking) throw new ApiError(404, 'Booking not found');
  const audit = await AuditLog.find({ entity: 'Booking', entityId: booking._id }).sort('createdAt').populate('actor', 'name role');
  ok(res, { booking, audit });
});

exports.approve = asyncHandler(async (req, res) => {
  ok(res, { booking: await svc.approveBooking(await load(req.params.id), req.user) }, 'Booking confirmed');
});

exports.assign = asyncHandler(async (req, res) => {
  const booking = await svc.assignTechnician(await load(req.params.id), req.body.technicianId, req.user);
  ok(res, { booking }, 'Technician assigned');
});

exports.cancel = asyncHandler(async (req, res) => {
  ok(res, { booking: await svc.cancelBooking(await load(req.params.id), req.user, req.body.reason) }, 'Booking cancelled');
});

// ----- technicians -----
exports.listTechnicians = asyncHandler(async (req, res) => {
  const filter = { role: 'technician' };
  if (req.query.assignable === 'true') Object.assign(filter, { isActive: true, 'technician.isAvailable': true });
  ok(res, { items: await User.find(filter).sort('name') });
});

exports.createTechnician = asyncHandler(async (req, res) => {
  const { password, skills, commissionPct, ...rest } = req.body;
  if (await User.exists({ email: rest.email })) throw new ApiError(409, 'An account with this email already exists');
  const technician = await User.create({
    ...rest,
    role: 'technician',
    passwordHash: await User.hashPassword(password),
    technician: { skills, commissionPct },
  });
  ok(res, { technician }, 'Technician created', 201);
});

exports.updateTechnician = asyncHandler(async (req, res) => {
  const b = req.body;
  const set = {};
  ['name', 'phone', 'isActive'].forEach((k) => { if (k in b) set[k] = b[k]; });
  if ('skills' in b) set['technician.skills'] = b.skills;
  if ('commissionPct' in b) set['technician.commissionPct'] = b.commissionPct;
  if ('isAvailable' in b) set['technician.isAvailable'] = b.isAvailable;
  if (!Object.keys(set).length) throw new ApiError(400, 'Nothing to update');

  if (b.isActive === false) {
    if (await Booking.exists({ technician: req.params.id, status: { $in: SLOT_HOLDING } })) {
      throw new ApiError(409, 'This technician has active jobs. Reassign them first.');
    }
    set.refreshTokens = []; // sign them out everywhere
  }
  const technician = await User.findOneAndUpdate({ _id: req.params.id, role: 'technician' }, { $set: set }, { new: true, runValidators: true });
  if (!technician) throw new ApiError(404, 'Technician not found');
  ok(res, { technician }, 'Technician updated');
});

// ----- customers -----
exports.listCustomers = asyncHandler(async (req, res) => {
  const filter = { role: 'customer' };
  if (req.query.q) {
    const re = new RegExp(escapeRegex(String(req.query.q)), 'i');
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }
  const p = paging(req.query, 20);
  const [items, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(p.skip).limit(p.limit),
    User.countDocuments(filter),
  ]);
  ok(res, pageOf(items, total, p));
});

exports.setCustomerStatus = asyncHandler(async (req, res) => {
  const set = { isActive: req.body.isActive };
  if (!req.body.isActive) set.refreshTokens = [];
  const customer = await User.findOneAndUpdate({ _id: req.params.id, role: 'customer' }, { $set: set }, { new: true });
  if (!customer) throw new ApiError(404, 'Customer not found');
  ok(res, { customer }, req.body.isActive ? 'Customer activated' : 'Customer deactivated');
});

// ----- settings -----
exports.getSettings = asyncHandler(async (req, res) => ok(res, { settings: await getSettings() }));
exports.putSettings = asyncHandler(async (req, res) => ok(res, { settings: await updateSettings(req.body) }, 'Settings saved'));