process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const email = require('../src/services/email.service');
const db = require('./helpers/db');

const PW = 'Passw0rdX';
const NEW_PW = 'BrandNewPass1';
const API = '/api/v1';
const EMAIL = 'customer@example.com';
const mk = (extra = {}) => User.hashPassword(PW).then((passwordHash) => User.create({ name: 'Asha Verma', email: EMAIL, passwordHash, role: 'customer', ...extra }));
const login = (password = PW, mail = EMAIL) => request(app).post(`${API}/auth/login`).send({ email: mail, password });
const forgot = (mail = EMAIL) => request(app).post(`${API}/auth/forgot-password`).send({ email: mail });
const reset = (token, newPassword = NEW_PW) => request(app).post(`${API}/auth/reset-password`).send({ token, newPassword });
const tokenFromEmail = () => {
  const m = email.outbox[email.outbox.length - 1]?.text.match(/token=([a-f0-9]{64})/);
  return m && m[1];
};

beforeAll(() => db.connect());
beforeEach(() => { email.outbox.length = 0; });
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('forgot password', () => {
  it('emails a link for a real account, answers identically for unknown emails, and stores only a hash', async () => {
    await mk();
    const known = await forgot();
    const unknown = await forgot('ghost@example.com');
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
    expect(email.outbox).toHaveLength(1);
    expect(email.outbox[0].to).toEqual([EMAIL]);
    const token = tokenFromEmail();
    const stored = await User.findOne({ email: EMAIL }).select('+resetTokenHash');
    expect(stored.resetTokenHash).toHaveLength(64);
    expect(stored.resetTokenHash).not.toBe(token);
  });
  it('sends nothing to deactivated accounts and rejects a malformed email', async () => {
    await mk({ isActive: false });
    expect((await forgot()).status).toBe(200);
    expect(email.outbox).toHaveLength(0);
    expect((await request(app).post(`${API}/auth/forgot-password`).send({ email: 'nope' })).status).toBe(400);
  });
});

describe('reset password', () => {
  it('sets the new password once and signs out every device', async () => {
    await mk();
    const first = await login();
    const accessToken = first.body.data.accessToken;
    const cookie = first.headers['set-cookie'].find((c) => c.startsWith('refreshToken=')).split(';')[0];

    await forgot();
    const token = tokenFromEmail();
    expect((await reset(token)).status).toBe(200);

    expect((await request(app).get(`${API}/auth/me`).set('Authorization', `Bearer ${accessToken}`)).status).toBe(401);
    expect((await request(app).post(`${API}/auth/refresh`).set('Cookie', cookie)).status).toBe(401);
    expect((await login(PW)).status).toBe(401);
    expect((await login(NEW_PW)).status).toBe(200);
    expect((await reset(token, 'AnotherPass2')).status).toBe(400); // the link cannot be used twice
  });
  it('rejects expired, malformed and weak requests without using up the link', async () => {
    await mk();
    await forgot();
    const token = tokenFromEmail();
    expect((await reset('abc')).status).toBe(400);
    expect((await reset('f'.repeat(64))).status).toBe(400);
    expect((await reset(token, 'short')).status).toBe(400); // weak password: link still valid afterwards
    await User.updateOne({ email: EMAIL }, { resetTokenExpires: new Date(Date.now() - 1000) });
    expect((await reset(token)).status).toBe(400); // expired
    await forgot();
    expect((await reset(tokenFromEmail())).status).toBe(200); // a fresh link works
  });
  it('lifts a login lockout', async () => {
    await mk();
    for (let i = 0; i < 5; i += 1) await login('Wrong123x');
    expect((await login(PW)).status).toBe(401); // locked
    await forgot();
    expect((await reset(tokenFromEmail())).status).toBe(200);
    expect((await login(NEW_PW)).status).toBe(200);
  });
});