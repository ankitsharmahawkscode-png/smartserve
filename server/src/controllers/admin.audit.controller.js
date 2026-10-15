const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { paging, pageOf } = require('../utils/paginate');

const AREAS = { booking: /^booking\./, payment: /^payment\./, review: /^review\./, auth: /^auth\./ };

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.area !== undefined && req.query.area !== '') {
    const area = String(req.query.area);
    if (!Object.hasOwn(AREAS, area)) throw new ApiError(400, 'Unknown area');
    filter.action = AREAS[area];
  }
  const p = paging(req.query, 25);
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort('-createdAt').skip(p.skip).limit(p.limit).populate('actor', 'name role'),
    AuditLog.countDocuments(filter),
  ]);
  ok(res, pageOf(items, total, p));
});