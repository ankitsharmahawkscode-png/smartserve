const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// entries: [{ loc, lastmod?, changefreq?, priority? }]
const buildSitemap = (entries) => {
  const rows = entries.map((e) => [
    '  <url>',
    `    <loc>${escapeXml(e.loc)}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n'));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
};

// Private areas are blocked from crawling. Login pages stay crawlable so their noindex tag can be read.
const buildRobots = (origin) => [
  'User-agent: *',
  'Disallow: /admin',
  'Disallow: /customer',
  'Disallow: /technician',
  'Allow: /',
  '',
  `Sitemap: ${origin}/sitemap.xml`,
  '',
].join('\n');

module.exports = { escapeXml, buildSitemap, buildRobots };