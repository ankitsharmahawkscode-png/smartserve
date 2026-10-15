process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const Category = require('../src/models/Category');
const Service = require('../src/models/Service');
const db = require('./helpers/db');
const { buildSitemap, buildRobots, escapeXml } = require('../src/utils/seo');

const API = '/api/v1/seo';
const ORIGIN = 'http://localhost:5173'; // CLIENT_URL default

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('seo helpers', () => {
  it('escapes XML characters', () => {
    expect(escapeXml(`a&b<c>"d'`)).toBe('a&amp;b&lt;c&gt;&quot;d&apos;');
    expect(buildSitemap([{ loc: 'https://x.test/a?b=1&c=2' }])).toContain('<loc>https://x.test/a?b=1&amp;c=2</loc>');
  });
  it('blocks private areas and points to the sitemap', () => {
    const r = buildRobots('https://x.test');
    ['/admin', '/customer', '/technician'].forEach((p) => expect(r).toContain(`Disallow: ${p}`));
    expect(r).not.toContain('Disallow: /login');
    expect(r).toContain('Sitemap: https://x.test/sitemap.xml');
  });
});

describe('sitemap and robots endpoints', () => {
  it('lists public pages, active categories and available services only', async () => {
    const live = await Category.create({ name: 'AC Repair', slug: 'ac-repair' });
    const hidden = await Category.create({ name: 'Hidden', slug: 'hidden', isActive: false });
    const a = await Service.create({ category: live._id, name: 'AC Gas', basePrice: 100 });
    const off = await Service.create({ category: live._id, name: 'Paused', basePrice: 100, isAvailable: false });
    const inHidden = await Service.create({ category: hidden._id, name: 'Secret', basePrice: 100 });

    const res = await request(app).get(`${API}/sitemap.xml`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.headers['cache-control']).toMatch(/public/);
    for (const path of ['/', '/services', '/about', '/contact', '/services?category=ac-repair', `/services/${a._id}`]) {
      expect(res.text).toContain(`<loc>${ORIGIN}${path}</loc>`);
    }
    expect(res.text).not.toContain(String(off._id));
    expect(res.text).not.toContain(String(inHidden._id));
    expect(res.text).not.toContain('category=hidden');
  });
  it('serves robots.txt as plain text', async () => {
    const res = await request(app).get(`${API}/robots.txt`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });
});