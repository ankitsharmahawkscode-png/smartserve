const Category = require('../models/Category');
const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');
const { buildSitemap, buildRobots } = require('../utils/seo');
const { clientUrl, nodeEnv } = require('../config/env');

const TTL = nodeEnv === 'test' ? 0 : 10 * 60 * 1000; // rebuilt at most every 10 minutes
let cache = { at: 0, xml: '' };
const day = (d) => new Date(d).toISOString().slice(0, 10);

exports.sitemap = asyncHandler(async (req, res) => {
  if (Date.now() - cache.at >= TTL) {
    const categories = await Category.find({ isActive: true }).select('slug updatedAt').lean();
    const services = await Service.find({ isAvailable: true, category: { $in: categories.map((c) => c._id) } })
      .select('updatedAt').sort('name').limit(5000).lean();
    const entries = [
      { loc: `${clientUrl}/`, changefreq: 'weekly', priority: '1.0' },
      { loc: `${clientUrl}/services`, changefreq: 'daily', priority: '0.9' },
      { loc: `${clientUrl}/about`, changefreq: 'monthly', priority: '0.5' },
      { loc: `${clientUrl}/contact`, changefreq: 'monthly', priority: '0.5' },
    ...categories.map((c) => ({ 
  loc: `${clientUrl}/category/${encodeURIComponent(c.slug)}`, 
  lastmod: day(c.updatedAt), 
  changefreq: 'weekly', 
  priority: '0.8' 
})),
      ...services.map((s) => ({ loc: `${clientUrl}/services/${s._id}`, lastmod: day(s.updatedAt), changefreq: 'weekly', priority: '0.7' })),
    ];
    cache = { at: Date.now(), xml: buildSitemap(entries) };
  }
  res.set('Cache-Control', 'public, max-age=3600').type('application/xml').send(cache.xml);
});

exports.robots = (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600').type('text/plain').send(buildRobots(clientUrl));
};