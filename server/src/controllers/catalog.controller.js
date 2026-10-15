const Category = require('../models/Category');
const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');
const { paging, pageOf } = require('../utils/paginate');
const { escapeRegex } = require('../utils/text');
const { getSettings } = require('../services/settings.service');
const bookingSvc = require('../services/booking.service');
const razorpay = require('../services/razorpay.service');
exports.categories = asyncHandler(async (req, res) => {
  ok(res, { items: await Category.find({ isActive: true }).sort('name') });
});

exports.services = asyncHandler(async (req, res) => {
  const cats = await Category.find({ isActive: true }).select('_id slug');
  let ids = cats.map((c) => c._id);
  const { category, q, available } = req.query;
  if (category) {
    const c = cats.find((x) => String(x._id) === String(category) || x.slug === category);
    ids = c ? [c._id] : [];
  }
  const filter = { category: { $in: ids } };
  if (available === 'true') filter.isAvailable = true;
  if (q) filter.name = new RegExp(escapeRegex(String(q)), 'i');

  const p = paging(req.query, 50);
  const [items, total] = await Promise.all([
    Service.find(filter).sort('name').skip(p.skip).limit(p.limit).populate('category', 'name slug'),
    Service.countDocuments(filter),
  ]);
  ok(res, pageOf(items, total, p));
});

exports.service = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate('category', 'name slug isActive');
  if (!service || !service.category || !service.category.isActive) throw new ApiError(404, 'Service not found');
  ok(res, { service });
});

exports.slots = asyncHandler(async (req, res) => {
  const date = String(req.query.date || '');
  ok(res, { date, slots: await bookingSvc.getSlots(req.params.id, date) });
});

exports.publicSettings = asyncHandler(async (req, res) => {
  const s = await getSettings();
  ok(res, { settings: { slots: s.slots, codEnabled: s.codEnabled, onlineEnabled: razorpay.isEnabled(), cancellation: s.cancellation, maxAdvanceDays: s.maxAdvanceDays } });
});