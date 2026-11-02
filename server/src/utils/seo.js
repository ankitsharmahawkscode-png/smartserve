const escapeXml = (s) =>
  String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Normalise so we never emit "https://site.com//path"
const trimOrigin = (o) => String(o).replace(/\/+$/, '');

// Google ignores <changefreq> and <priority>, so only <loc> and an honest <lastmod> are emitted.
// entries: [{ loc, lastmod? }]
const buildSitemap = (entries) => {
  const rows = entries.map((e) =>
    [
      '  <url>',
      `    <loc>${escapeXml(e.loc)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      '  </url>',
    ].filter(Boolean).join('\n')
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
};

const buildRobots = (origin, { allowCrawling = true } = {}) => {
  // Staging/dev must never be indexed
  if (!allowCrawling) return 'User-agent: *\nDisallow: /\n';

  return [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /customer',
    'Disallow: /technician',
    'Disallow: /api/',
    // Faceted/duplicate URLs waste crawl budget (adjust to your real params)
    'Disallow: /*?sort=',
    'Disallow: /*&sort=',
    'Disallow: /*?page=',
    'Allow: /',
    '',
    `Sitemap: ${trimOrigin(origin)}/sitemap.xml`,
    '',
  ].join('\n');
};

module.exports = { escapeXml, trimOrigin, buildSitemap, buildRobots };