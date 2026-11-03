const User = require('../models/User');
const Blog = require('../models/Blog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

const readMins = (html) => {
  const words = String(html || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

// Public: only safe fields (no email, no phone)
exports.getAuthorBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase();
  const user = await User.findOne({ 'profile.slug': slug, isActive: true });
  if (!user) throw new ApiError(404, 'Author not found');

  const filter = { author: user._id, isPublished: true };
  const [total, blogs] = await Promise.all([
    Blog.countDocuments(filter),
    Blog.find(filter).sort('-publishedAt').limit(20),
  ]);

  const p = user.profile || {};
  const s = p.social || {};

  ok(res, {
    author: {
      name: user.name,
      slug: p.slug,
      designation: p.designation || '',
      workplace: p.workplace || '',
      location: p.location || '',
      avatar: p.avatar || '',
      about: p.about || [],
      social: {
        linkedin: s.linkedin || '',
        twitter: s.twitter || '',
        facebook: s.facebook || '',
        instagram: s.instagram || '',
        website: s.website || '',
      },
    },
    total,
    posts: blogs.map((b) => ({
      _id: b._id,
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt || '',
      coverImage: b.coverImage || '',
      publishedAt: b.publishedAt,
      createdAt: b.createdAt,
      readMins: readMins(b.content),
    })),
  });
});