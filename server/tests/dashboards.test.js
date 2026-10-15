process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const db = require('./helpers/db');
const { todayIST, addDays } = require('../src/utils/dates');

const PW = 'Passw0rdX';
const API = '/api/v1';
const mk = (role, name = role) =>
  User.hashPassword(PW).then((passwordHash) => User.create({ name: `${name} user`, email: `${name}@example.com`, passwordHash, role }));
const tokenOf = async (email) => (await request(app).post(`${API}/auth/login`).send({ email, password: PW })).body.data.accessToken;
const api = (token) => {
  const h = (m) => (url, body) => {
    const r = request(app)[m](API + url).set('Authorization', `Bearer ${token}`);
    return body ? r.send(body) : r;
  };
  return { get: h('get'), post: h('post'), put: h('put'), patch: h('patch') };
};

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.disconnect());

it('admin stats are admin-only and shaped for the dashboard', async () => {
  const admin = await mk('admin');
  const cust = await mk('customer');
  const A = api(await tokenOf(admin.email));
  const C = api(await tokenOf(cust.email));
  expect((await C.get('/admin/stats')).status).toBe(403);
  const res = await A.get('/admin/stats');
  expect(res.status).toBe(200);
  expect(res.body.data.stats.last7).toHaveLength(7);
  expect(res.body.data.stats).toMatchObject({ todayBookings: 0, awaiting: 0, revenueThisMonth: 0 });
});

it('technician earnings apply the commission to completed jobs', async () => {
  const admin = await mk('admin');
  const tech = await mk('technician');
  const cust = await mk('customer');
  const A = api(await tokenOf(admin.email));
  const T = api(await tokenOf(tech.email));
  const C = api(await tokenOf(cust.email));
  await A.patch(`/admin/technicians/${tech._id}`, { commissionPct: 10 });
  const cat = (await A.post('/admin/categories', { name: 'Plumbing' })).body.data.category;
  const svc = (await A.post('/admin/services', { category: cat._id, name: 'Leak repair', basePrice: 500, pricingType: 'estimate' })).body.data.service;
  const b = (await C.post('/bookings', {
    serviceId: svc._id, date: addDays(todayIST(), 2), slot: '14:00-16:00', paymentMethod: 'cod',
    address: { line1: '12 MG Road', city: 'Jaipur', pincode: '302001' },
  })).body.data.booking;
  await A.patch(`/admin/bookings/${b._id}/approve`);
  await A.patch(`/admin/bookings/${b._id}/assign`, { technicianId: String(tech._id) });
  await T.patch(`/tech/jobs/${b._id}/respond`, { accept: true });
  await T.patch(`/tech/jobs/${b._id}/status`, { status: 'IN_PROGRESS' });
  await T.patch(`/tech/jobs/${b._id}/status`, { status: 'COMPLETED', finalPrice: 1800 });

  const res = await T.get('/tech/earnings');
  expect(res.status).toBe(200);
  expect(res.body.data.commissionPct).toBe(10);
  expect(res.body.data.totals.jobs).toBe(1);
  expect(res.body.data.totals.earned).toBe(180);
  expect(res.body.data.items[0].earning).toBe(180);
  expect((await A.get('/admin/stats')).body.data.stats.byStatus.COMPLETED).toBe(1);
});