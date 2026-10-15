process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const db = require('./helpers/db');

const PW = 'Passw0rdX';
const API = '/api/v1';
const EMAIL = 'customer@example.com';
const mk = (role) => User.hashPassword(PW).then((passwordHash) => User.create({ name: `${role} user`, email: `${role}@example.com`, passwordHash, role }));
const login = (email, password = PW) => request(app).post(`${API}/auth/login`).send({ email, password });
const cookieOf = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken=')).split(';')[0];

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('request hardening', () => {
  it('rejects MongoDB operators in query strings and bodies', async () => {
    expect((await request(app).get(`${API}/services?category[$ne]=x`)).status).toBe(400);
    expect((await request(app).post(`${API}/auth/login`).send({ email: { $gt: '' }, password: 'x' })).status).toBe(400);
  });
  it('sets safe headers and hides the framework', async () => {
    const res = await request(app).get(`${API}/health`);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cache-control']).toBe('no-store');
  });
  it('answers malformed JSON with a clean 400', async () => {
    const res = await request(app).post(`${API}/auth/login`).set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
  it('refuses cookie endpoints from a foreign origin', async () => {
    expect((await request(app).post(`${API}/auth/refresh`).set('Origin', 'https://evil.example')).status).toBe(403);
    expect((await request(app).post(`${API}/auth/logout`).set('Origin', 'https://evil.example')).status).toBe(403);
  });
});

describe('sensitive data', () => {
  it('never returns password hashes, tokens or lockout fields', async () => {
    await mk('customer');
    const token = (await login(EMAIL)).body.data.accessToken;
    const res = await request(app).get(`${API}/auth/me`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|refreshTokens|failedLogins|lockUntil|tokenVersion/);
  });
});

describe('login lockout', () => {
  it('locks after 5 failures even for the right password, hides that fact, and audits it', async () => {
    await mk('customer');
    const admin = await mk('admin');
    for (let i = 0; i < 5; i += 1) expect((await login(EMAIL, 'Wrong123x')).status).toBe(401);

    const lockedRes = await login(EMAIL, PW);
    expect(lockedRes.status).toBe(401);
    expect(lockedRes.body.message).toBe((await login('ghost@example.com', PW)).body.message); // nothing to enumerate

    const adminToken = (await login(admin.email)).body.data.accessToken;
    const audit = await request(app).get(`${API}/admin/audit?area=auth`).set('Authorization', `Bearer ${adminToken}`);
    expect(audit.body.data.items.some((i) => i.action === 'auth.lockout')).toBe(true);

    await User.updateOne({ email: EMAIL }, { lockUntil: new Date(Date.now() - 1000) }); // simulate 15 minutes passing
    expect((await login(EMAIL, PW)).status).toBe(200);
    const u = await User.findOne({ email: EMAIL }).select('+failedLogins +lockUntil');
    expect(u.failedLogins).toBe(0);
    expect(u.lockUntil == null).toBe(true);
  });
});

describe('password change', () => {
  it('validates the current password and signs out every device', async () => {
    await mk('customer');
    const first = await login(EMAIL);
    const token = first.body.data.accessToken;
    const cookie = cookieOf(first);
    const put = (body) => request(app).put(`${API}/me/password`).set('Authorization', `Bearer ${token}`).send(body);

    expect((await put({ currentPassword: 'Nope1234', newPassword: 'NewPassw0rd' })).status).toBe(400);
    expect((await put({ currentPassword: PW, newPassword: PW })).status).toBe(400); // must differ
    expect((await put({ currentPassword: PW, newPassword: 'short' })).status).toBe(400);
    expect((await put({ currentPassword: PW, newPassword: 'NewPassw0rd' })).status).toBe(200);

    expect((await request(app).get(`${API}/auth/me`).set('Authorization', `Bearer ${token}`)).status).toBe(401); // old access token dead
    expect((await request(app).post(`${API}/auth/refresh`).set('Cookie', cookie)).status).toBe(401); // old refresh token dead
    expect((await login(EMAIL, PW)).status).toBe(401);
    expect((await login(EMAIL, 'NewPassw0rd')).status).toBe(200);
  });
});

describe('activity log', () => {
  it('is admin-only and rejects unknown areas', async () => {
    const admin = await mk('admin');
    const cust = await mk('customer');
    const A = (await login(admin.email)).body.data.accessToken;
    const C = (await login(cust.email)).body.data.accessToken;
    const get = (path, t) => request(app).get(`${API}${path}`).set('Authorization', `Bearer ${t}`);
    expect((await get('/admin/audit', C)).status).toBe(403);
    expect((await get('/admin/audit', A)).status).toBe(200);
    expect((await get('/admin/audit?area=constructor', A)).status).toBe(400);
    expect((await get('/admin/audit?area=booking', A)).body.data.items).toEqual([]);
  });
});