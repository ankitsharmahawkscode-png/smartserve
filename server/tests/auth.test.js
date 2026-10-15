process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const db = require('./helpers/db');

const PW = 'Passw0rdX';
const A = '/api/v1/auth';
const valid = { name: 'Asha Verma', email: 'asha@example.com', phone: '9876543210', password: PW };
const cookieOf = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='));
const cookieHeader = (res) => cookieOf(res).split(';')[0];

async function makeUser(role, extra = {}) {
  return User.create({ name: `${role} user`, email: `${role}@example.com`, passwordHash: await User.hashPassword(PW), role, ...extra });
}
const login = (email, password = PW) => request(app).post(`${A}/login`).send({ email, password });

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('register', () => {
  it('creates a customer, hashes the password and hides secrets', async () => {
    const res = await request(app).post(`${A}/register`).send({ ...valid, role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer'); // role in body is ignored
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.refreshTokens).toBeUndefined();
    expect(res.body.data.accessToken).toBeTruthy();
    expect(cookieOf(res)).toMatch(/HttpOnly/i);
    const stored = await User.findOne({ email: valid.email }).select('+passwordHash');
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.passwordHash).not.toContain(PW);
  });

  it('rejects invalid input with field errors', async () => {
    const res = await request(app).post(`${A}/register`).send({ name: 'A', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('rejects a duplicate email (case-insensitive)', async () => {
    await request(app).post(`${A}/register`).send(valid);
    const res = await request(app).post(`${A}/register`).send({ ...valid, email: 'ASHA@example.com' });
    expect(res.status).toBe(409);
  });
});

describe('login', () => {
  beforeEach(() => request(app).post(`${A}/register`).send(valid));

  it('logs in with correct credentials', async () => {
    const res = await login(valid.email);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(cookieOf(res)).toBeTruthy();
  });
  it('gives the same generic error for wrong password and unknown email', async () => {
    const bad = await login(valid.email, 'WrongPass1');
    const unknown = await login('ghost@example.com');
    expect(bad.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(bad.body.message).toBe(unknown.body.message);
  });
  it('blocks deactivated accounts', async () => {
    await User.updateOne({ email: valid.email }, { isActive: false });
    const res = await login(valid.email);
    expect(res.status).toBe(403);
  });
});

describe('me and protected access', () => {
  it('requires a valid token', async () => {
    expect((await request(app).get(`${A}/me`)).status).toBe(401);
    expect((await request(app).get(`${A}/me`).set('Authorization', 'Bearer junk')).status).toBe(401);
  });
  it('returns the current user', async () => {
    const reg = await request(app).post(`${A}/register`).send(valid);
    const res = await request(app).get(`${A}/me`).set('Authorization', `Bearer ${reg.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(valid.email);
  });
  it('rejects an existing token once the account is deactivated', async () => {
    const reg = await request(app).post(`${A}/register`).send(valid);
    await User.updateOne({ email: valid.email }, { isActive: false });
    const res = await request(app).get(`${A}/me`).set('Authorization', `Bearer ${reg.body.data.accessToken}`);
    expect(res.status).toBe(401);
  });
});

describe('refresh and logout', () => {
  it('rotates the refresh token', async () => {
    const reg = await request(app).post(`${A}/register`).send(valid);
    const res = await request(app).post(`${A}/refresh`).set('Cookie', cookieHeader(reg));
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe(valid.email);
    expect(cookieHeader(res)).not.toBe(cookieHeader(reg));
  });
  it('detects reuse of an old refresh token and revokes all sessions', async () => {
    const reg = await request(app).post(`${A}/register`).send(valid);
    const second = await request(app).post(`${A}/refresh`).set('Cookie', cookieHeader(reg));
    const replay = await request(app).post(`${A}/refresh`).set('Cookie', cookieHeader(reg));
    expect(replay.status).toBe(401);
    const afterRevoke = await request(app).post(`${A}/refresh`).set('Cookie', cookieHeader(second));
    expect(afterRevoke.status).toBe(401);
  });
  it('fails without a cookie', async () => {
    expect((await request(app).post(`${A}/refresh`)).status).toBe(401);
  });
  it('logout revokes the refresh token', async () => {
    const reg = await request(app).post(`${A}/register`).send(valid);
    const out = await request(app).post(`${A}/logout`).set('Cookie', cookieHeader(reg));
    expect(out.status).toBe(200);
    const res = await request(app).post(`${A}/refresh`).set('Cookie', cookieHeader(reg));
    expect(res.status).toBe(401);
  });
});

describe('role-based access control', () => {
  const tokenFor = async (role) => { await makeUser(role); return (await login(`${role}@example.com`)).body.data.accessToken; };
  const get = (path, token) => request(app).get(path).set('Authorization', `Bearer ${token}`);

  it('rejects unauthenticated requests', async () => {
    expect((await request(app).get('/api/v1/admin/ping')).status).toBe(401);
  });
  it('admin routes: only admins', async () => {
    expect((await get('/api/v1/admin/ping', await tokenFor('customer'))).status).toBe(403);
    expect((await get('/api/v1/admin/ping', await tokenFor('technician'))).status).toBe(403);
    expect((await get('/api/v1/admin/ping', await tokenFor('admin'))).status).toBe(200);
  });
  it('technician routes: only technicians', async () => {
    expect((await get('/api/v1/tech/ping', await tokenFor('customer'))).status).toBe(403);
    expect((await get('/api/v1/tech/ping', await tokenFor('technician'))).status).toBe(200);
  });
  it('role changes apply immediately, even with an old token', async () => {
    const token = await tokenFor('admin');
    await User.updateOne({ email: 'admin@example.com' }, { role: 'customer' });
    expect((await get('/api/v1/admin/ping', token)).status).toBe(403);
  });
});