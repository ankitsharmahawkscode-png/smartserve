process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');
const db = require('./helpers/db');
const { todayIST, addDays } = require('../src/utils/dates');
const { canTransition } = require('../src/utils/bookingStatus');

const PW = 'Passw0rdX';
const API = '/api/v1';
const SLOT = '14:00-16:00';
const date = () => addDays(todayIST(), 3);
const ADDRESS = { line1: '12 MG Road', city: 'Jaipur', pincode: '302001' };

const mk = (role, name = role) =>
  User.hashPassword(PW).then((passwordHash) => User.create({ name: `${name} user`, email: `${name}@example.com`, passwordHash, role }));
const tokenOf = async (email) =>
  (await request(app).post(`${API}/auth/login`).send({ email, password: PW })).body.data.accessToken;
const api = (token) => {
  const h = (m) => (url, body) => {
    const r = request(app)[m](API + url).set('Authorization', `Bearer ${token}`);
    return body ? r.send(body) : r;
  };
  return { get: h('get'), post: h('post'), put: h('put'), patch: h('patch'), del: h('delete') };
};
const body = (svc, over = {}) => ({ serviceId: svc._id, date: date(), slot: SLOT, address: ADDRESS, paymentMethod: 'cod', ...over });

async function world() {
  const admin = await mk('admin');
  const tech = await mk('technician');
  const cust = await mk('customer');
  const A = api(await tokenOf(admin.email));
  const T = api(await tokenOf(tech.email));
  const C = api(await tokenOf(cust.email));
  const cat = (await A.post('/admin/categories', { name: 'AC Repair' })).body.data.category;
  const svc = (await A.post('/admin/services', { category: cat._id, name: 'AC Gas Refill', basePrice: 1500, pricingType: 'estimate' })).body.data.service;
  return { admin, tech, cust, A, T, C, cat, svc };
}
const confirmed = async (w, over) => {
  const b = (await w.C.post('/bookings', body(w.svc, over))).body.data.booking;
  await w.A.patch(`/admin/bookings/${b._id}/approve`);
  return b;
};

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('state machine', () => {
  it('allows only documented transitions', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    expect(canTransition('ASSIGNED', 'CONFIRMED')).toBe(true);
    expect(canTransition('PENDING', 'COMPLETED')).toBe(false);
    expect(canTransition('IN_PROGRESS', 'CANCELLED')).toBe(false);
    expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
  });
});

describe('catalog', () => {
  it('lets only admins manage it, and anyone browse it', async () => {
    const w = await world();
    expect((await w.C.post('/admin/categories', { name: 'Hack' })).status).toBe(403);
    const list = await request(app).get(`${API}/services`);
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);
    const cats = await request(app).get(`${API}/categories`);
    expect(cats.body.data.items[0].slug).toBe('ac-repair');
  });
  it('refuses to delete a category that has services', async () => {
    const w = await world();
    expect((await w.A.del(`/admin/categories/${w.cat._id}`)).status).toBe(409);
  });
});

describe('slots and booking creation', () => {
  it('lists slots and rejects past dates', async () => {
    const w = await world();
    const ok = await request(app).get(`${API}/services/${w.svc._id}/slots?date=${date()}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.slots.length).toBeGreaterThan(0);
    const past = await request(app).get(`${API}/services/${w.svc._id}/slots?date=${addDays(todayIST(), -1)}`);
    expect(past.status).toBe(400);
  });
  it('creates a PENDING booking with a snapshot address and booking number', async () => {
    const w = await world();
    const res = await w.C.post('/bookings', body(w.svc));
    expect(res.status).toBe(201);
    expect(res.body.data.booking.status).toBe('PENDING');
    expect(res.body.data.booking.bookingNo).toMatch(/^BK-\d{6}$/);
    expect(res.body.data.booking.estimatedPrice).toBe(1500);
    expect(res.body.data.booking.holdsSlot).toBeUndefined();
  });
  it('rejects unavailable services, bad slots and full slots', async () => {
    const w = await world();
    expect((await w.C.post('/bookings', body(w.svc, { slot: '03:00-04:00' }))).status).toBe(400);
    await w.A.put('/admin/settings', { slotCapacity: 1 });
    expect((await w.C.post('/bookings', body(w.svc))).status).toBe(201);
    const other = await mk('customer', 'cust2');
    const C2 = api(await tokenOf(other.email));
    expect((await C2.post('/bookings', body(w.svc))).status).toBe(409);
    await w.A.put(`/admin/services/${w.svc._id}`, { isAvailable: false });
    expect((await C2.post('/bookings', body(w.svc, { slot: '09:00-11:00' }))).status).toBe(400);
  });
  it('blocks the same customer double-booking one slot', async () => {
    const w = await world();
    await w.C.post('/bookings', body(w.svc));
    expect((await w.C.post('/bookings', body(w.svc))).status).toBe(409);
  });
});

describe('booking lifecycle', () => {
  it('runs PENDING to COMPLETED and logs every step', async () => {
    const w = await world();
    const b = (await w.C.post('/bookings', body(w.svc))).body.data.booking;

    expect((await w.A.patch(`/admin/bookings/${b._id}/assign`, { technicianId: String(w.tech._id) })).status).toBe(409); // not confirmed yet
    expect((await w.A.patch(`/admin/bookings/${b._id}/approve`)).body.data.booking.status).toBe('CONFIRMED');
    expect((await w.A.patch(`/admin/bookings/${b._id}/assign`, { technicianId: String(w.tech._id) })).body.data.booking.status).toBe('ASSIGNED');

    expect((await w.T.patch(`/tech/jobs/${b._id}/status`, { status: 'COMPLETED' })).status).toBe(409); // skipping steps
    expect((await w.T.patch(`/tech/jobs/${b._id}/respond`, { accept: true })).body.data.booking.status).toBe('ACCEPTED');
    expect((await w.T.patch(`/tech/jobs/${b._id}/status`, { status: 'IN_PROGRESS' })).body.data.booking.status).toBe('IN_PROGRESS');
    expect((await w.T.patch(`/tech/jobs/${b._id}/status`, { status: 'COMPLETED' })).status).toBe(400); // needs final amount
    const done = await w.T.patch(`/tech/jobs/${b._id}/status`, { status: 'COMPLETED', finalPrice: 1800 });
    expect(done.body.data.booking.status).toBe('COMPLETED');
    expect(done.body.data.booking.finalPrice).toBe(1800);

    expect((await w.C.patch(`/bookings/${b._id}/cancel`, { reason: 'changed my mind' })).status).toBe(409);
    expect(await AuditLog.countDocuments({ entity: 'Booking', entityId: b._id })).toBeGreaterThanOrEqual(6);
    const detail = await w.A.get(`/admin/bookings/${b._id}`);
    expect(detail.body.data.booking.statusHistory.length).toBeGreaterThanOrEqual(6);
  });
  it('sends a rejected job back to CONFIRMED and frees the technician', async () => {
    const w = await world();
    const b = await confirmed(w);
    await w.A.patch(`/admin/bookings/${b._id}/assign`, { technicianId: String(w.tech._id) });
    const rej = await w.T.patch(`/tech/jobs/${b._id}/respond`, { accept: false, reason: 'too far' });
    expect(rej.body.data.booking.status).toBe('CONFIRMED');
    expect(rej.body.data.booking.technician).toBeNull();
    expect((await w.T.get(`/tech/jobs/${b._id}`)).status).toBe(404);
  });
});

describe('conflicts and isolation', () => {
  it('stops one technician being assigned two jobs in the same slot', async () => {
    const w = await world();
    const b1 = await confirmed(w);
    const cust2 = await mk('customer', 'cust2');
    const C2 = api(await tokenOf(cust2.email));
    const b2 = (await C2.post('/bookings', body(w.svc))).body.data.booking;
    await w.A.patch(`/admin/bookings/${b2._id}/approve`);

    expect((await w.A.patch(`/admin/bookings/${b1._id}/assign`, { technicianId: String(w.tech._id) })).status).toBe(200);
    const clash = await w.A.patch(`/admin/bookings/${b2._id}/assign`, { technicianId: String(w.tech._id) });
    expect(clash.status).toBe(409);
    expect(clash.body.message).toMatch(/already has a job/i);
  });
  it('hides jobs and bookings from people who do not own them', async () => {
    const w = await world();
    const b = await confirmed(w);
    await w.A.patch(`/admin/bookings/${b._id}/assign`, { technicianId: String(w.tech._id) });
    const tech2 = await mk('technician', 'tech2');
    const T2 = api(await tokenOf(tech2.email));
    expect((await T2.get(`/tech/jobs/${b._id}`)).status).toBe(404);
    expect((await T2.patch(`/tech/jobs/${b._id}/respond`, { accept: true })).status).toBe(404);
    const cust2 = await mk('customer', 'cust2');
    const C2 = api(await tokenOf(cust2.email));
    expect((await C2.get(`/bookings/${b._id}`)).status).toBe(404);
    expect((await C2.patch(`/bookings/${b._id}/cancel`, {})).status).toBe(404);
  });
  it('will not deactivate a technician who has active jobs', async () => {
    const w = await world();
    const b = await confirmed(w);
    await w.A.patch(`/admin/bookings/${b._id}/assign`, { technicianId: String(w.tech._id) });
    expect((await w.A.patch(`/admin/technicians/${w.tech._id}`, { isActive: false })).status).toBe(409);
  });
});

describe('cancellation policy', () => {
  it('charges a fee inside the free window and none outside it', async () => {
    const w = await world();
    await w.A.put('/admin/settings', { cancellation: { freeHoursBefore: 100000, feePercent: 20 } });
    const b1 = (await w.C.post('/bookings', body(w.svc))).body.data.booking;
    const late = await w.C.patch(`/bookings/${b1._id}/cancel`, { reason: 'plans changed' });
    expect(late.status).toBe(200);
    expect(late.body.data.booking.cancellation.fee).toBe(300); // 20% of 1500

    await w.A.put('/admin/settings', { cancellation: { freeHoursBefore: 0, feePercent: 20 } });
    const b2 = (await w.C.post('/bookings', body(w.svc))).body.data.booking;
    const early = await w.C.patch(`/bookings/${b2._id}/cancel`, { reason: 'plans changed' });
    expect(early.body.data.booking.cancellation.fee).toBe(0);
  });
  it('lets an admin cancel with a reason, free of charge', async () => {
    const w = await world();
    const b = (await w.C.post('/bookings', body(w.svc))).body.data.booking;
    expect((await w.A.patch(`/admin/bookings/${b._id}/cancel`, {})).status).toBe(400);
    const res = await w.A.patch(`/admin/bookings/${b._id}/cancel`, { reason: 'No technician available' });
    expect(res.body.data.booking.cancellation.fee).toBe(0);
  });
});

describe('profile and addresses', () => {
  it('saves an address and books with it', async () => {
    const w = await world();
    const added = await w.C.post('/me/addresses', { ...ADDRESS, label: 'Home' });
    expect(added.status).toBe(201);
    const addressId = added.body.data.user.addresses[0]._id;
    expect(added.body.data.user.addresses[0].isDefault).toBe(true);
    const res = await w.C.post('/bookings', { serviceId: w.svc._id, date: date(), slot: SLOT, addressId, paymentMethod: 'cod' });
    expect(res.status).toBe(201);
    expect(res.body.data.booking.address.line1).toBe('12 MG Road');
  });
});