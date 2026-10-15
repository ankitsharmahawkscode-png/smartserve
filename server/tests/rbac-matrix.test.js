process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const db = require('./helpers/db');

const PW = 'Passw0rdX';
const API = '/api/v1';
const ID = '507f1f77bcf86cd799439011';
const tokens = {};

beforeAll(async () => {
  await db.connect();
  for (const role of ['admin', 'technician', 'customer']) {
    await User.create({ name: `${role} user`, email: `${role}@example.com`, passwordHash: await User.hashPassword(PW), role });
    tokens[role] = (await request(app).post(`${API}/auth/login`).send({ email: `${role}@example.com`, password: PW })).body.data.accessToken;
  }
});
afterAll(() => db.disconnect());

const as = (method, path, token) => {
  const r = request(app)[method](API + path);
  return token ? r.set('Authorization', `Bearer ${token}`) : r;
};

// Read endpoints: who may call them. Anyone else must get 403, and a missing token must get 401.
const READS = [
  ['/admin/stats', 'admin'], ['/admin/bookings', 'admin'], ['/admin/payments', 'admin'], ['/admin/reviews', 'admin'],
  ['/admin/settings', 'admin'], ['/admin/customers', 'admin'], ['/admin/technicians', 'admin'], ['/admin/audit', 'admin'],
  ['/admin/categories', 'admin'], ['/admin/services', 'admin'],
  ['/tech/jobs', 'technician'], ['/tech/earnings', 'technician'],
  ['/bookings', 'customer'], ['/payments/mine', 'customer'], ['/reviews/mine', 'customer'],
  ['/me', 'any'],
];
describe('read endpoints', () => {
  it.each(READS)('GET %s is for: %s', async (path, allowed) => {
    expect((await as('get', path)).status).toBe(401);
    for (const role of ['admin', 'technician', 'customer']) {
      const res = await as('get', path, tokens[role]);
      expect(res.status).toBe(allowed === 'any' || allowed === role ? 200 : 403);
    }
  });
});

// Write endpoints: roles that must be refused. Invalid bodies are fine, because the role check runs before validation.
const WRITES = [
  ['post', '/admin/categories', ['technician', 'customer']], ['post', '/admin/services', ['technician', 'customer']],
  ['put', '/admin/settings', ['technician', 'customer']], ['post', '/admin/technicians', ['technician', 'customer']],
  ['patch', `/admin/bookings/${ID}/approve`, ['technician', 'customer']], ['patch', `/admin/bookings/${ID}/assign`, ['technician', 'customer']],
  ['post', `/admin/payments/${ID}/refund`, ['technician', 'customer']], ['patch', `/admin/reviews/${ID}`, ['technician', 'customer']],
  ['patch', `/admin/customers/${ID}/status`, ['technician', 'customer']],
  ['post', '/bookings', ['admin', 'technician']], ['patch', `/bookings/${ID}/cancel`, ['admin', 'technician']],
  ['post', '/payments/order', ['admin', 'technician']], ['post', '/payments/verify', ['admin', 'technician']],
  ['post', '/reviews', ['admin', 'technician']],
  ['patch', `/tech/jobs/${ID}/respond`, ['admin', 'customer']], ['patch', `/tech/jobs/${ID}/status`, ['admin', 'customer']],
  ['put', '/tech/availability', ['admin', 'customer']],
];
describe('write endpoints', () => {
  it.each(WRITES)('%s %s refuses the wrong roles', async (method, path, refused) => {
    expect((await as(method, path)).status).toBe(401);
    for (const role of refused) expect((await as(method, path, tokens[role])).status).toBe(403);
  });
});

describe('public endpoints', () => {
  it.each(['/health', '/categories', '/services', '/settings/public'])('GET %s needs no login', async (path) => {
    expect((await as('get', path)).status).toBe(200);
  });
  it('the payment webhook needs a valid signature, not a login', async () => {
    const res = await request(app).post(`${API}/payments/webhook`).set('Content-Type', 'application/json').send('{}');
    expect(res.status).toBe(400);
  });
});