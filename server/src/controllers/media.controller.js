const Media = require('../models/Media');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

const MAX_RASTER = 700 * 1024;
const MAX_SVG = 150 * 1024;
// An SVG can carry code, so anything that could run is refused
const BAD_SVG = /<script|<foreignObject|<iframe|<embed|<object|javascript:|\son[a-z]+\s*=/i;

const isJpeg = (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const isPng = (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;

// ---- Admin: POST /admin/media ----
exports.upload = asyncHandler(async (req, res) => {
  const { name, type, data } = req.body;
  const buf = Buffer.from(data, 'base64');
  if (!buf.length) throw new ApiError(400, 'The image is empty');

  if (type === 'image/svg+xml') {
    if (buf.length > MAX_SVG) throw new ApiError(400, 'An SVG must be 150 KB or smaller');
    const text = buf.toString('utf8');
    if (!/<svg[\s>]/i.test(text)) throw new ApiError(400, 'This is not a valid SVG file');
    if (BAD_SVG.test(text)) throw new ApiError(400, 'This SVG contains code that is not allowed');
  } else {
    if (buf.length > MAX_RASTER) throw new ApiError(400, 'The image is too large. Try a smaller one');
    const good = type === 'image/jpeg' ? isJpeg(buf) : isPng(buf);
    if (!good) throw new ApiError(400, 'The file does not match its image type');
  }

  const doc = await Media.create({
    name,
    contentType: type,
    size: buf.length,
    data: buf,
    createdBy: req.user._id,
  });
  ok(res, { url: `/api/v1/media/${doc._id}` }, 'Image uploaded', 201);
});

// ---- Public: GET /api/v1/media/:id ----
exports.getMedia = asyncHandler(async (req, res) => {
  if (!/^[0-9a-f]{24}$/i.test(req.params.id)) throw new ApiError(404, 'Image not found');
  const m = await Media.findById(req.params.id).select('data contentType');
  if (!m) throw new ApiError(404, 'Image not found');

  res.set({
    'Content-Type': m.contentType,
    'Content-Length': m.data.length,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  // Even if someone opens an SVG directly, it cannot run scripts
  if (m.contentType === 'image/svg+xml') {
    res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }
  res.send(m.data);
});