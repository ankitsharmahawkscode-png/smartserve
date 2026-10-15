process.env.NODE_ENV = 'test';
process.env.ADMIN_NOTIFY_EMAIL = 'owner@example.com';
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const ContactMessage = require('../src/models/ContactMessage');
const email = require('../src/services/email.service');
const db = require('./helpers/db');

const PW = 'Passw0rdX';
const API = '/api/v1';
const valid = { name: 'Asha Verma', email: 'asha@example.com', message: 'My AC is not cooling. Can you visit tomorrow?' };
const tokenFor = async (role) => {
  await User.create({ name: `${role} user`, email: `${role}@example.com`, passwordHash: await User.hashPassword(PW), role });
  return (await request(app).post(`${API}/auth/login`).send({ email: `${role}@example.com`, password: PW })).body.data.accessToken;
};

beforeAll(() => db.connect());
beforeEach(() => { email.outbox.length = 0; });
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('contact form', () => {
  it('stores a valid message and emails the owner', async () => {
    const res = await request(app).post(`${API}/contact`).send(valid);
    expect(res.status).toBe(201);
    expect(await ContactMessage.countDocuments()).toBe(1);
    expect(email.outbox.some((m) => m.to.includes('owner@example.com') && /Asha/.test(m.subject))).toBe(true);
  });
  it('rejects invalid input', async () => {
    expect((await request(app).post(`${API}/contact`).send({ name: 'A', email: 'nope', message: 'short' })).status).toBe(400);
    expect(await ContactMessage.countDocuments()).toBe(0);
  });
  it('silently drops bot submissions that fill the hidden field', async () => {
    const res = await request(app).post(`${API}/contact`).send({ ...valid, website: 'http://spam.example' });
    expect(res.status).toBe(201);
    expect(await ContactMessage.countDocuments()).toBe(0);
  });
  it('lets only admins read messages', async () => {
    await request(app).post(`${API}/contact`).send(valid);
    const customer = await tokenFor('customer');
    const admin = await tokenFor('admin');
    expect((await request(app).get(`${API}/admin/messages`)).status).toBe(401);
    expect((await request(app).get(`${API}/admin/messages`).set('Authorization', `Bearer ${customer}`)).status).toBe(403);
    const res = await request(app).get(`${API}/admin/messages`).set('Authorization', `Bearer ${admin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });
});