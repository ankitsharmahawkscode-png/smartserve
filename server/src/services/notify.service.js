const Booking = require('../models/Booking');
const email = require('./email.service');
const { clientUrl, appName, adminNotifyEmail, nodeEnv } = require('../config/env');

const when = (b) => `${b.date}, ${b.slot.replace('-', ' - ')}`;
const url = (b, role) => `${clientUrl}/${role}/${role === 'technician' ? 'jobs' : 'bookings'}/${b._id}`;
const subject = (b, s) => `${appName}: ${s} (${b.bookingNo})`;
const toCustomer = (b, s, body) => ({ to: b.customer.email, subject: subject(b, s), text: `Hi ${b.customer.name},\n\n${body}\n\nView your booking: ${url(b, 'customer')}` });

const TEMPLATES = {
  'booking.created': (b) => [
    toCustomer(b, 'Booking received', `We received your booking for ${b.service.name} on ${when(b)}. We will confirm it shortly.`),
    ...(adminNotifyEmail ? [{ to: adminNotifyEmail, subject: subject(b, 'New booking'), text: `${b.customer.name} booked ${b.service.name} for ${when(b)}.` }] : []),
  ],
  'booking.confirmed': (b) => [toCustomer(b, 'Booking confirmed', `Your booking for ${b.service.name} on ${when(b)} is confirmed. A technician will be assigned soon.`)],
  'booking.assigned': (b) => [
    toCustomer(b, 'Technician assigned', `${b.technician?.name || 'A technician'} has been assigned to your ${b.service.name} booking on ${when(b)}.`),
    ...(b.technician ? [{ to: b.technician.email, subject: subject(b, 'New job assigned'), text: `Hi ${b.technician.name},\n\nYou have a new job: ${b.service.name} on ${when(b)}.\n\nOpen it: ${url(b, 'technician')}` }] : []),
  ],
  'booking.accepted': (b) => [toCustomer(b, 'Technician accepted', `${b.technician?.name || 'Your technician'} accepted your booking on ${when(b)}.`)],
  'booking.rejected': (b) => (adminNotifyEmail ? [{ to: adminNotifyEmail, subject: subject(b, 'Technician rejected a job'), text: `${b.bookingNo} needs a new technician (${when(b)}).` }] : []),
  'booking.started': (b) => [toCustomer(b, 'Work started', `Your technician has started work on ${b.service.name}.`)],
  'booking.completed': (b) => [toCustomer(b, 'Job completed', `Your ${b.service.name} job is complete. Final amount: Rs ${b.finalPrice ?? b.estimatedPrice}. Please leave a review from the Reviews page.`)],
  'booking.cancelled': (b, x) => [
    toCustomer(b, 'Booking cancelled', `Your booking on ${when(b)} was cancelled.${x.fee ? ` A cancellation fee of Rs ${x.fee} applies.` : ''}`),
    ...(b.technician ? [{ to: b.technician.email, subject: subject(b, 'Job cancelled'), text: `The job on ${when(b)} was cancelled.` }] : []),
  ],
  'payment.paid': (b) => [toCustomer(b, 'Payment received', `We received your payment for ${b.service.name}. Thank you.`)],
  'payment.refunded': (b, x) => [toCustomer(b, 'Refund processed', `A refund of Rs ${x.amount} has been issued for your cancelled booking. It reaches your account in 5-7 working days.`)],
};

// Email problems never break the main request. In tests it waits so assertions are deterministic.
exports.notify = async (event, bookingId, extra = {}) => {
  const job = (async () => {
    const build = TEMPLATES[event];
    if (!build) return;
    const b = await Booking.findById(bookingId).populate('customer', 'name email').populate('technician', 'name email').populate('service', 'name');
    if (!b || !b.customer) return;
    for (const message of build(b, extra)) await email.send(message);
  })().catch((e) => console.error(`Notification ${event} failed:`, e.message));
  if (nodeEnv === 'test') await job;
};