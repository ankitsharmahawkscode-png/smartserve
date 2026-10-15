const Category = require('../models/Category');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { paging, pageOf } = require('../utils/paginate');
const { slugify, escapeRegex } = require('../utils/text');

// ----- categories -----
exports.listCategories = asyncHandler(async (req, res) => {
  ok(res, { items: await Category.find().sort('name') });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({ ...req.body, slug: slugify(req.body.name) });
  ok(res, { category }, 'Category created', 201);
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const patch = { ...req.body };
  if (patch.name) patch.slug = slugify(patch.name);
  const category = await Category.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
  if (!category) throw new ApiError(404, 'Category not found');
  ok(res, { category }, 'Category updated');
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  if (await Service.exists({ category: req.params.id })) {
    throw new ApiError(409, 'This category still has services. Deactivate it instead of deleting.');
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  ok(res, null, 'Category deleted');
});

// ----- services -----
exports.listServices = asyncHandler(async (req, res) => {
  const { category, q, isAvailable } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (isAvailable === 'true' || isAvailable === 'false') filter.isAvailable = isAvailable === 'true';
  if (q) filter.name = new RegExp(escapeRegex(String(q)), 'i');
  const p = paging(req.query, 20);
  const [items, total] = await Promise.all([
    Service.find(filter).sort('name').skip(p.skip).limit(p.limit).populate('category', 'name'),
    Service.countDocuments(filter),
  ]);
  ok(res, pageOf(items, total, p));
});

exports.createService = asyncHandler(async (req, res) => {
  if (!(await Category.exists({ _id: req.body.category }))) throw new ApiError(400, 'Category not found');
  const service = await Service.create(req.body);
  ok(res, { service }, 'Service created', 201);
});

exports.updateService = asyncHandler(async (req, res) => {
  if (req.body.category && !(await Category.exists({ _id: req.body.category }))) throw new ApiError(400, 'Category not found');
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!service) throw new ApiError(404, 'Service not found');
  ok(res, { service }, 'Service updated');
});

exports.deleteService = asyncHandler(async (req, res) => {
  if (await Booking.exists({ service: req.params.id })) {
    throw new ApiError(409, 'This service has bookings. Mark it unavailable instead of deleting.');
  }
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw new ApiError(404, 'Service not found');
  ok(res, null, 'Service deleted');
});