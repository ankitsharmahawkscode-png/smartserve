process.env.NODE_ENV = 'test';
process.env.RAZORPAY_KEY_ID = 'rzp_test_abcdef123456';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_value_123';
process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_test_123';

jest.mock('../src/services/razorpay.service', () => {
  const real = jest.requireActual('../src/services/razorpay.service');
  return { ...real, createOrder: jest.fn(), fetchPayment: jest.fn(), capture: jest.fn(), refund: jest.fn() };
});

const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Payment = require('../src/models/Payment');
const razorpay = require('../src/services/razorpay.service');
const email = require('../src/services/email.service');
const db = require('./helpers/db');
const { todayIST, addDays } = require('../src/utils/dates');

const PW = 'Passw0rdX';
const API = '/api/v1';
const SECRET = 'test_secret_value_123';
const sign = (order, pay) => crypto.createHmac('sha256', SECRET).update(`${order}|${pay}`).digest('hex');
const ADDRESS = { line1: '12 MG Road', city: 'Jaipur', pincode: '302001' };

const mk = (role, name = role) =>
  User.hashPassword(PW).then((passwordHash) => User.create({ name: `${name} user`, email: `${name}@example.com`, passwordHash, role }));
const tokenOf = async (email_) => (await request(app).post(`${API}/auth/login`).send({ email: email_, password: PW })).body.data.accessToken;
const api = (token) => {
  const h = (m) => (url, body) => {
    const r = request(app)[m](API + url).set('Authorization', `Bearer ${token}`);
    return body ? r.send(body) : r;
  };
  return { get: h('get'), post: h('post'), put: h('put'), patch: h('patch') };
};

async function world() {
  const [admin, tech, cust] = await Promise.all([mk('admin'), mk('technician'), mk('customer')]);
  const A = api(await tokenOf(admin.email));
  const T = api(await tokenOf(tech.email));
  const C = api(await tokenOf(cust.email));
  const cat = (await A.post('/admin/categories', { name: 'Plumbing' })).body.data.category;
  const fixed = (await A.post('/admin/services', { category: cat._id, name: 'Tap fitting', basePrice: 1000, pricingType: 'fixed' })).body.data.service;
  const estimate = (await A.post('/admin/services', { category: cat._id, name: 'Leak repair', basePrice: 500, pricingType: 'estimate' })).body.data.service;
  return { admin, tech, cust, A, T, C, fixed, estimate };
}
const book = (w, svc, over = {}) =>
  w.C.post('/bookings', { serviceId: svc._id, date: addDays(todayIST(), 3), slot: '14:00-16:00', address: ADDRESS, paymentMethod: 'online', ...over }).then((r) => r.body.data.booking);
const payOnline = async (w, booking, ids = { order: 'order_T1', pay: 'pay_T1' }) => {
  razorpay.createOrder.mockResolvedValue({ id: ids.order });
  await w.C.post('/payments/order', { bookingId: booking._id });
  razorpay.fetchPayment.mockResolvedValue({ id: ids.pay, order_id: ids.order, amount: Math.round(booking.estimatedPrice * 100), status: 'captured' });
  return w.C.post('/payments/verify', { razorpay_order_id: ids.order, razorpay_payment_id: ids.pay, razorpay_signature: sign(ids.order, ids.pay) });
};

beforeAll(() => db.connect());
beforeEach(() => { jest.clearAllMocks(); email.outbox.length = 0; });
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('online payment', () => {
  it('creates an order with a server-side amount and verifies a valid signature', async () => {
    const w = await world();
    const b = await book(w, w.fixed);
    razorpay.createOrder.mockResolvedValue({ id: 'order_T1' });
    const order = await w.C.post('/payments/order', { bookingId: b._id, amount: 1 }); // a client-sent amount is ignored
    expect(order.status).toBe(200);
    expect(razorpay.createOrder).toHaveBeenCalledWith(expect.objectContaining({ amountPaise: 100000 }));
    expect(order.body.data.keyId).toBe('rzp_test_abcdef123456');

    const res = await payOnline(w, b);
    expect(res.status).toBe(200);
    expect(res.body.data.payment.status).toBe('paid');
    expect((await w.C.get(`/bookings/${b._id}`)).body.data.booking.paymentStatus).toBe('paid');
    expect(email.outbox.some((m) => /Payment received/.test(m.subject))).toBe(true);

    expect((await w.C.post('/payments/order', { bookingId: b._id })).status).toBe(409); // already paid, no second order
    const replay = await w.C.post('/payments/verify', { razorpay_order_id: 'order_T1', razorpay_payment_id: 'pay_T1', razorpay_signature: sign('order_T1', 'pay_T1') });
    expect(replay.status).toBe(200); // verifying twice is harmless
  });

  it('rejects a bad signature and keeps the booking unpaid', async () => {
    const w = await world();
    const b = await book(w, w.fixed);
    razorpay.createOrder.mockResolvedValue({ id: 'order_T2' });
    await w.C.post('/payments/order', { bookingId: b._id });
    const res = await w.C.post('/payments/verify', { razorpay_order_id: 'order_T2', razorpay_payment_id: 'pay_T2', razorpay_signature: 'f'.repeat(64) });
    expect(res.status).toBe(400);
    expect((await w.C.get(`/bookings/${b._id}`)).body.data.booking.paymentStatus).toBe('unpaid');
    expect(razorpay.fetchPayment).not.toHaveBeenCalled();
  });

  it('rejects when the provider reports a different amount', async () => {
    const w = await world();
    const b = await book(w, w.fixed);
    razorpay.createOrder.mockResolvedValue({ id: 'order_T3' });
    await w.C.post('/payments/order', { bookingId: b._id });
    razorpay.fetchPayment.mockResolvedValue({ id: 'pay_T3', order_id: 'order_T3', amount: 100, status: 'captured' });
    const res = await w.C.post('/payments/verify', { razorpay_order_id: 'order_T3', razorpay_payment_id: 'pay_T3', razorpay_signature: sign('order_T3', 'pay_T3') });
    expect(res.status).toBe(400);
    expect((await w.C.get(`/bookings/${b._id}`)).body.data.booking.paymentStatus).toBe('unpaid');
  });

  it("does not let another customer verify or pay someone else's booking", async () => {
    const w = await world();
    const b = await book(w, w.fixed);
    const other = await mk('customer', 'other');
    const O = api(await tokenOf(other.email));
    expect((await O.post('/payments/order', { bookingId: b._id })).status).toBe(404);
    razorpay.createOrder.mockResolvedValue({ id: 'order_T4' });
    await w.C.post('/payments/order', { bookingId: b._id });
    const res = await O.post('/payments/verify', { razorpay_order_id: 'order_T4', razorpay_payment_id: 'pay_T4', razorpay_signature: sign('order_T4', 'pay_T4') });
    expect(res.status).toBe(404);
  });

  it('opens payment for estimate services only after completion', async () => {
    const w = await world();
    const b = await book(w, w.estimate);
    expect((await w.C.post('/payments/order', { bookingId: b._id })).status).toBe(409);
  });
});

describe('webhook', () => {
  it('rejects a bad signature and records a valid payment.captured event', async () => {
    const w = await world();
    const b = await book(w, w.fixed);
    razorpay.createOrder.mockResolvedValue({ id: 'order_W' });
    await w.C.post('/payments/order', { bookingId: b._id });
    const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_W', order_id: 'order_W', amount: 100000, status: 'captured' } } } });
    const post = (sig) => request(app).post(`${API}/payments/webhook`).set('Content-Type', 'application/json').set('X-Razorpay-Signature', sig).send(raw);

    expect((await post('0'.repeat(64))).status).toBe(400);
    expect((await w.C.get(`/bookings/${b._id}`)).body.data.booking.paymentStatus).toBe('unpaid');
    expect((await post(crypto.createHmac('sha256', 'whsec_test_123').update(raw).digest('hex'))).status).toBe(200);
    expect((await w.C.get(`/bookings/${b._id}`)).body.data.booking.paymentStatus).toBe('paid');
  });
});

describe('cash on service', () => {
  it('records the cash payment when the technician completes the job', async () => {
    const w = await world();
    const b = await book(w, w.fixed, { paymentMethod: 'cod' });
    await w.A.patch(`/admin/bookings/${b._id}/approve`);
    await w.A.patch(`/admin/bookings/${b._id}/assign`, { technicianId: String(w.tech._id) });
    await w.T.patch(`/tech/jobs/${b._id}/respond`, { accept: true });
    await w.T.patch(`/tech/jobs/${b._id}/status`, { status: 'IN_PROGRESS' });
    await w.T.patch(`/tech/jobs/${b._id}/status`, { status: 'COMPLETED' });
    expect((await w.C.get(`/bookings/${b._id}`)).body.data.booking.paymentStatus).toBe('paid');
    const list = await w.A.get('/admin/payments?provider=cash');
    expect(list.body.data.items).toHaveLength(1);
    expect(list.body.data.items[0].amount).toBe(1000);
  });
});

describe('refunds', () => {
  it('refunds the paid amount minus the cancellation fee, once', async () => {
    const w = await world();
    await w.A.put('/admin/settings', { cancellation: { freeHoursBefore: 100000, feePercent: 20 } });
    const b = await book(w, w.fixed);
    await payOnline(w, b);
    const cancelled = await w.C.patch(`/bookings/${b._id}/cancel`, { reason: 'plans changed' });
    expect(cancelled.body.data.booking.paymentStatus).toBe('refund_pending');
    expect(cancelled.body.data.booking.cancellation.fee).toBe(200);

    const due = await w.A.get('/admin/payments?refundDue=true');
    expect(due.body.data.items).toHaveLength(1);
    razorpay.refund.mockResolvedValue({ id: 'rfnd_1' });
    const id = due.body.data.items[0]._id;
    const res = await w.A.post(`/admin/payments/${id}/refund`);
    expect(res.status).toBe(200);
    expect(razorpay.refund).toHaveBeenCalledWith('pay_T1', 80000, expect.anything());
    expect(res.body.data.payment).toMatchObject({ status: 'refunded', refundAmount: 800, refundId: 'rfnd_1' });
    expect((await w.C.get(`/bookings/${b._id}`)).body.data.booking.paymentStatus).toBe('refunded');
    expect((await w.A.post(`/admin/payments/${id}/refund`)).status).toBe(409); // no double refund
    expect(razorpay.refund).toHaveBeenCalledTimes(1);
    expect(email.outbox.some((m) => /Refund processed/.test(m.subject))).toBe(true);
  });

  it('restores the payment if the provider refund fails', async () => {
    const w = await world();
    const b = await book(w, w.fixed);
    await payOnline(w, b);
    await w.C.patch(`/bookings/${b._id}/cancel`, { reason: 'plans changed' });
    razorpay.refund.mockRejectedValue(new Error('provider down'));
    const id = (await Payment.findOne())._id;
    expect((await w.A.post(`/admin/payments/${id}/refund`)).status).toBeGreaterThanOrEqual(400);
    expect((await Payment.findById(id)).status).toBe('paid');
  });

  it('only admins can refund', async () => {
    const w = await world();
    const b = await book(w, w.fixed);
    await payOnline(w, b);
    const id = (await Payment.findOne())._id;
    expect((await w.C.post(`/admin/payments/${id}/refund`)).status).toBe(403);
  });
});

describe('reviews', () => {
  const complete = async (w, b) => {
    await w.A.patch(`/admin/bookings/${b._id}/approve`);
    await w.A.patch(`/admin/bookings/${b._id}/assign`, { technicianId: String(w.tech._id) });
    await w.T.patch(`/tech/jobs/${b._id}/respond`, { accept: true });
    await w.T.patch(`/tech/jobs/${b._id}/status`, { status: 'IN_PROGRESS' });
    await w.T.patch(`/tech/jobs/${b._id}/status`, { status: 'COMPLETED', finalPrice: 1000 });
  };

  it('allows one review per completed booking, by its owner only', async () => {
    const w = await world();
    const b = await book(w, w.fixed, { paymentMethod: 'cod' });
    expect((await w.C.post('/reviews', { bookingId: b._id, rating: 5 })).status).toBe(409); // not completed
    await complete(w, b);
    const other = await mk('customer', 'other');
    const O = api(await tokenOf(other.email));
    expect((await O.post('/reviews', { bookingId: b._id, rating: 1 })).status).toBe(404);
    expect((await w.C.post('/reviews', { bookingId: b._id, rating: 6 })).status).toBe(400);
    expect((await w.C.post('/reviews', { bookingId: b._id, rating: 4, comment: 'Quick and neat' })).status).toBe(201);
    expect((await w.C.post('/reviews', { bookingId: b._id, rating: 5 })).status).toBe(409);
    const mine = await w.C.get('/reviews/mine');
    expect(mine.body.data.reviews).toHaveLength(1);
    expect(mine.body.data.pending).toHaveLength(0);
  });

  it('shows visible reviews with an average, and hides moderated ones', async () => {
    const w = await world();
    const b = await book(w, w.fixed, { paymentMethod: 'cod' });
    await complete(w, b);
    const review = (await w.C.post('/reviews', { bookingId: b._id, rating: 4, comment: 'Good' })).body.data.review;
    const pub = await request(app).get(`${API}/services/${w.fixed._id}/reviews`);
    expect(pub.body.data.summary).toEqual({ average: 4, count: 1 });
    expect(pub.body.data.items[0].author).toBe('customer');
    expect(pub.body.data.items[0].customer).toBeUndefined(); // no email or full name

    expect((await w.C.patch(`/admin/reviews/${review._id}`, { isHidden: true })).status).toBe(403);
    expect((await w.A.patch(`/admin/reviews/${review._id}`, { isHidden: true })).status).toBe(200);
    expect((await request(app).get(`${API}/services/${w.fixed._id}/reviews`)).body.data.summary.count).toBe(0);
  });
});

describe('email notifications', () => {
  it('emails the customer when a booking is created and confirmed', async () => {
    const w = await world();
    const b = await book(w, w.fixed, { paymentMethod: 'cod' });
    await w.A.patch(`/admin/bookings/${b._id}/approve`);
    const subjects = email.outbox.filter((m) => m.to.includes('customer@example.com')).map((m) => m.subject);
    expect(subjects.some((s) => /Booking received/.test(s))).toBe(true);
    expect(subjects.some((s) => /Booking confirmed/.test(s))).toBe(true);
  });
});