const Category = require('../models/Category');
const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');
const { buildSitemap, buildRobots, trimOrigin } = require('../utils/seo');
const { clientUrl, nodeEnv } = require('../config/env');

const ORIGIN = trimOrigin(clientUrl);
const TTL = nodeEnv === 'test' ? 0 : 10 * 60 * 1000;
const MAX_SERVICES = 45000; // sitemap hard limit is 50,000 URLs / 50 MB per file

let cache = { at: 0, xml: '', lastmod: null };
let building = null; // shared promise: prevents a stampede of simultaneous rebuilds

const day = (d) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? undefined : t.toISOString().slice(0, 10);
};
const newest = (dates) => dates.filter(Boolean).sort().pop();

const build = async () => {
  const categories = await Category.find({ isActive: true })
    .select('slug updatedAt').lean();

  const services = await Service.find({
    isAvailable: true,
    category: { $in: categories.map((c) => c._id) },
  })
    .select('updatedAt')
    .sort('-updatedAt')
    .limit(MAX_SERVICES)
    .lean();

  const catEntries = categories.map((c) => ({
    loc: `${ORIGIN}/category/${encodeURIComponent(c.slug)}`,
    lastmod: day(c.updatedAt),
  }));
  const svcEntries = services.map((s) => ({
    loc: `${ORIGIN}/services/${s._id}`,
    lastmod: day(s.updatedAt),
  }));

  // Listing pages are only as fresh as their newest content; static pages get no fake date.
  const listingMod = newest([...catEntries, ...svcEntries].map((e) => e.lastmod));

  const entries = [
    { loc: `${ORIGIN}/`, lastmod: listingMod },
    { loc: `${ORIGIN}/services`, lastmod: listingMod },
    { loc: `${ORIGIN}/about` },
    { loc: `${ORIGIN}/contact` },
    ...catEntries,
    ...svcEntries,
  ];

  return { at: Date.now(), xml: buildSitemap(entries), lastmod: listingMod };
};

const getSitemap = async () => {
  if (cache.xml && Date.now() - cache.at < TTL) return cache;
  building = building || build().finally(() => { building = null; });
  try {
    cache = await building;
  } catch (err) {
    if (!cache.xml) throw err; // serve stale sitemap if DB hiccups
  }
  return cache;
};

exports.sitemap = asyncHandler(async (req, res) => {
  const { xml } = await getSitemap();
  res
    .set('Cache-Control', 'public, max-age=3600')
    .type('application/xml; charset=utf-8')
    .send(xml);
});

exports.robots = (req, res) => {
  res
    .set('Cache-Control', 'public, max-age=3600')
    .type('text/plain; charset=utf-8')
    .send(buildRobots(ORIGIN, { allowCrawling: nodeEnv === 'production' }));
};