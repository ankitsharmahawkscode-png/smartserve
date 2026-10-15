const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const razorpay = require('./razorpay.service');
const { notify } = require('./notify.service');
const { logAudit } = require('../utils/audit');

const paise = (rupees) => Math.round(rupees * 100);

// The amount is always decided here, never by the client.
async function payableAmount(booking) {
  if (booking.status === 'CANCELLED') throw new ApiError(409, 'This booking was cancelled');
  if (booking.paymentMethod !== 'online') throw new ApiError(400, 'This booking is set to cash on service');
  if (booking.paymentStatus !== 'unpaid') throw new ApiError(409, 'This booking is already paid');
  const service = await Service.findById(booking.service).select('pricingType');
  let amount;
  if (service?.pricingType === 'estimate') {
    if (booking.status !== 'COMPLETED' || booking.finalPrice == null) {
      throw new ApiError(409, 'Payment opens once the job is completed and the final amount is set');
    }
    amount = booking.finalPrice;
  } else {
    amount = booking.finalPrice ?? booking.estimatedPrice;
  }
  if (!(amount > 0)) throw new ApiError(400, 'Nothing to pay for this booking');
  return amount;
}

async function createOrder(customer, bookingId) {
  const booking = await Booking.findOne({ _id: bookingId, customer: customer._id });
  if (!booking) throw new ApiError(404, 'Booking not found');
  const amount = await payableAmount(booking);
  const order = await razorpay.createOrder({ amountPaise: paise(amount), receipt: booking.bookingNo, notes: { bookingId: String(booking._id) } });
  await Payment.create({ booking: booking._id, customer: customer._id, provider: 'razorpay', orderId: order.id, amount, status: 'created' });
  return { orderId: order.id, amount, amountPaise: paise(amount), currency: 'INR', keyId: razorpay.keyId(), bookingNo: booking.bookingNo };
}

// Moves a payment to paid exactly once, even if the browser and the webhook both report it.
async function markPaid(payment, paymentId, actor) {
  const updated = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $in: ['created', 'failed'] } },
    { $set: { status: 'paid', paymentId, verifiedAt: new Date() }, $unset: { failureReason: 1 } },
    { new: true }
  );
  if (!updated) return Payment.findById(payment._id);
  await Booking.updateOne({ _id: payment.booking, paymentStatus: 'unpaid' }, { $set: { paymentStatus: 'paid' } });
  await logAudit(actor, 'payment.paid', 'Booking', payment.booking, { orderId: payment.orderId, paymentId, amount: payment.amount });
  await notify('payment.paid', payment.booking);
  return updated;
}

const fail = async (payment, reason, actor) => {
  await Payment.updateOne({ _id: payment._id, status: 'created' }, { $set: { status: 'failed', failureReason: reason } });
  await logAudit(actor, 'payment.failed', 'Booking', payment.booking, { orderId: payment.orderId, reason });
  throw new ApiError(400, 'Payment verification failed');
};

async function verifyPayment(customer, { orderId, paymentId, signature }) {
  const payment = await Payment.findOne({ orderId, customer: customer._id, provider: 'razorpay' });
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.status === 'paid') return payment; // already verified, safe to repeat
  if (!razorpay.verifySignature(orderId, paymentId, signature)) return fail(payment, 'Signature mismatch', customer);

  // Second check with the provider: right order, right amount, and actually paid.
  const remote = await razorpay.fetchPayment(paymentId);
  if (remote.order_id !== orderId || remote.amount !== paise(payment.amount)) return fail(payment, 'Order or amount mismatch', customer);
  if (remote.status === 'authorized') await razorpay.capture(paymentId, paise(payment.amount));
  else if (remote.status !== 'captured') return fail(payment, `Provider status ${remote.status}`, customer);

  return markPaid(payment, paymentId, customer);
}

// Safety net: if the customer closes the browser after paying, the webhook still records it.
async function handleWebhook(event) {
  if (event.event !== 'payment.captured' && event.event !== 'order.paid') return;
  const entity = event.payload?.payment?.entity;
  if (!entity) return;
  const payment = await Payment.findOne({ orderId: entity.order_id });
  if (!payment || payment.status === 'paid' || payment.status === 'refunded') return;
  if (entity.amount !== paise(payment.amount)) return;
  await markPaid(payment, entity.id, null);
}

// Cash collected by the technician when a cash-on-service job is completed.
async function recordCash(booking, actor) {
  const amount = booking.finalPrice ?? booking.estimatedPrice;
  try {
    await Payment.create({ booking: booking._id, customer: booking.customer, provider: 'cash', orderId: `cash-${booking.bookingNo}`, amount, status: 'paid', verifiedAt: new Date() });
  } catch (e) {
    if (e.code !== 11000) throw e;
    return;
  }
  await logAudit(actor, 'payment.cash', 'Booking', booking._id, { amount });
  await notify('payment.paid', booking._id);
}

async function refundPayment(payment, admin) {
  if (payment.provider !== 'razorpay') throw new ApiError(400, 'Cash payments are refunded outside the system');
  if (payment.status !== 'paid') throw new ApiError(409, 'Only paid payments can be refunded');
  const booking = await Booking.findById(payment.booking);
  if (!booking || booking.paymentStatus !== 'refund_pending') {
    throw new ApiError(409, 'No refund is due. The booking must be cancelled first.');
  }
  const fee = booking.cancellation?.fee || 0;
  const amount = Math.max(0, payment.amount - fee);

  // Claim the payment first so two clicks cannot refund twice.
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'paid' },
    { $set: { status: 'refunded', refundAmount: amount, refundedAt: new Date() } },
    { new: true }
  );
  if (!claimed) throw new ApiError(409, 'This payment is already being refunded');

  if (amount > 0) {
    try {
      const r = await razorpay.refund(payment.paymentId, paise(amount), { bookingNo: booking.bookingNo });
      claimed.refundId = r.id;
      await claimed.save();
    } catch (e) {
      await Payment.updateOne({ _id: payment._id }, { $set: { status: 'paid' }, $unset: { refundAmount: 1, refundedAt: 1 } });
      throw e;
    }
  }
  await Booking.updateOne({ _id: booking._id }, { $set: { paymentStatus: 'refunded' } });
  await logAudit(admin, 'payment.refund', 'Booking', booking._id, { amount, fee, refundId: claimed.refundId });
  await notify('payment.refunded', booking._id, { amount });
  return claimed;
}

module.exports = { createOrder, verifyPayment, handleWebhook, recordCash, refundPayment };