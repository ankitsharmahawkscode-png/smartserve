const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const Counter = require('../models/Counter');
const ApiError = require('../utils/ApiError');
const { getSettings } = require('./settings.service');
const { notify } = require('./notify.service');
const payments = require('./payment.service');
const { ACTIVE_STATUSES, assertTransition } = require('../utils/bookingStatus');
const { todayIST, addDays, slotStart, isValidDate } = require('../utils/dates');
const { logAudit } = require('../utils/audit');

async function getBookableService(serviceId) {
  if (!mongoose.isValidObjectId(serviceId)) throw new ApiError(404, 'Service not found');
  const service = await Service.findById(serviceId).populate('category');
  if (!service || !service.category || !service.category.isActive) throw new ApiError(404, 'Service not found');
  if (!service.isAvailable) throw new ApiError(400, 'This service is currently unavailable');
  return service;
}

async function slotsFor(date, s) {
  if (!isValidDate(date)) throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
  const today = todayIST();
  if (date < today || date > addDays(today, s.maxAdvanceDays)) {
    throw new ApiError(400, `Choose a date within the next ${s.maxAdvanceDays} days`);
  }
  const counts = await Booking.aggregate([
    { $match: { date, status: { $in: ACTIVE_STATUSES } } },
    { $group: { _id: '$slot', n: { $sum: 1 } } },
  ]);
  const used = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  const earliest = Date.now() + s.minLeadHours * 3600 * 1000;
  return s.slots.map((slot) => {
    const past = slotStart(date, slot).getTime() < earliest;
    const full = (used[slot] || 0) >= s.slotCapacity;
    return { slot, available: !past && !full, reason: past ? 'past' : full ? 'full' : null };
  });
}

async function getSlots(serviceId, date) {
  await getBookableService(serviceId);
  return slotsFor(date, await getSettings());
}

// Atomic: only applies if the booking is still in the status we last read.
async function applyTransition(booking, to, actor, set = {}, note) {
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: booking.status },
    {
      $set: { ...set, status: to },
      $push: { statusHistory: { from: booking.status, to, by: actor._id, at: new Date(), note } },
    },
    { new: true }
  );
  if (!updated) throw new ApiError(409, 'This booking was just changed by someone else. Refresh and try again.');
  return updated;
}
const move = (booking, to, actor, set, note) => {
  assertTransition(booking.status, to);
  return applyTransition(booking, to, actor, set, note);
};

async function createBooking(customer, input) {
  const s = await getSettings();
  const service = await getBookableService(input.serviceId);

  const slots = await slotsFor(input.date, s);
  const chosen = slots.find((x) => x.slot === input.slot);
  if (!chosen) throw new ApiError(400, 'Invalid time slot');
  if (!chosen.available) {
    throw new ApiError(409, chosen.reason === 'past' ? 'That time slot is no longer available' : 'That time slot is full. Please choose another.');
  }
  if (input.paymentMethod === 'cod' && !s.codEnabled) throw new ApiError(400, 'Cash on service is not available');
  if (input.paymentMethod === 'online' && !require('./razorpay.service').isEnabled()) throw new ApiError(400, 'Online payment is not available right now');

  let address = input.address;
  if (input.addressId) {
    const a = customer.addresses.id(input.addressId);
    if (!a) throw new ApiError(400, 'Saved address not found');
    address = { label: a.label, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode };
  }

  const clash = await Booking.exists({ customer: customer._id, date: input.date, slot: input.slot, status: { $in: ACTIVE_STATUSES } });
  if (clash) throw new ApiError(409, 'You already have a booking in that time slot');

  const seq = await Counter.next('booking');
  const booking = await Booking.create({
    bookingNo: `BK-${String(seq).padStart(6, '0')}`,
    customer: customer._id,
    service: service._id,
    date: input.date,
    slot: input.slot,
    address,
    notes: input.notes,
    estimatedPrice: service.basePrice,
    paymentMethod: input.paymentMethod,
    statusHistory: [{ from: null, to: 'PENDING', by: customer._id }],
  });
  await logAudit(customer, 'booking.create', 'Booking', booking._id, { bookingNo: booking.bookingNo });
  await notify('booking.created', booking._id);
  return booking;
}

async function approveBooking(booking, admin) {
  const updated = await move(booking, 'CONFIRMED', admin);
  await logAudit(admin, 'booking.approve', 'Booking', booking._id);
  await notify('booking.confirmed', booking._id);
  return updated;
}

async function assignTechnician(booking, technicianId, admin) {
  if (!['CONFIRMED', 'ASSIGNED'].includes(booking.status)) {
    throw new ApiError(409, 'Only confirmed bookings can be assigned a technician');
  }
  const tech = await User.findOne({ _id: technicianId, role: 'technician' });
  if (!tech || !tech.isActive) throw new ApiError(400, 'Technician not found or inactive');
  if (!tech.technician || !tech.technician.isAvailable) throw new ApiError(400, 'This technician is marked unavailable');

  const previous = booking.technician;
  const set = { technician: tech._id, holdsSlot: true };
  let updated;
  try {
    // ASSIGNED -> ASSIGNED is a reassignment (technician hasn't accepted yet)
    updated =
      booking.status === 'ASSIGNED'
        ? await applyTransition(booking, 'ASSIGNED', admin, set, 'Reassigned')
        : await move(booking, 'ASSIGNED', admin, set);
  } catch (e) {
    if (e.code === 11000) throw new ApiError(409, 'This technician already has a job in that time slot');
    throw e;
  }
  await logAudit(admin, 'booking.assign', 'Booking', booking._id, { technician: tech._id, previous });
  await notify('booking.assigned', booking._id);
  return updated;
}

async function respondToJob(booking, tech, accept, reason) {
  if (booking.status !== 'ASSIGNED') throw new ApiError(409, 'This job is no longer waiting for your response');
  if (accept) {
    const updated = await move(booking, 'ACCEPTED', tech);
    await logAudit(tech, 'booking.accept', 'Booking', booking._id);
    await notify('booking.accepted', booking._id);
    return updated;
  }
  const updated = await move(booking, 'CONFIRMED', tech, { technician: null, holdsSlot: false }, reason || 'Rejected by technician');
  await logAudit(tech, 'booking.reject', 'Booking', booking._id, { reason });
  await notify('booking.rejected', booking._id);
  return updated;
}

async function advanceJob(booking, tech, to, finalPrice) {
  // Validate the status transition first.
  // Invalid transitions must return 409, even if finalPrice is missing.
  assertTransition(booking.status, to);

  const set = {};

  if (to === 'COMPLETED') {
    const svc = await Service.findById(booking.service).select('pricingType');

    if (svc && svc.pricingType === 'estimate' && finalPrice == null) {
      throw new ApiError(400, 'Enter the final amount for this job');
    }

    set.finalPrice = finalPrice == null ? booking.estimatedPrice : finalPrice;
    set.holdsSlot = false;

    if (booking.paymentMethod === 'cod') {
      set.paymentStatus = 'paid'; // cash collected on site
    }
  }

  const updated = await move(booking, to, tech, set);

  await logAudit(tech, 'booking.status', 'Booking', booking._id, {
    to,
    finalPrice: set.finalPrice
  });

  if (to === 'COMPLETED' && booking.paymentMethod === 'cod') {
    await payments.recordCash(updated, tech);
  }

  await notify(
    to === 'COMPLETED' ? 'booking.completed' : 'booking.started',
    booking._id
  );

  return updated;
}

async function cancelBooking(booking, actor, reason) {
  assertTransition(booking.status, 'CANCELLED');
  let fee = 0;
  if (actor.role === 'customer') {
    const s = await getSettings();
    const hoursLeft = (slotStart(booking.date, booking.slot).getTime() - Date.now()) / 3600000;
    if (hoursLeft < s.cancellation.freeHoursBefore) fee = Math.round((booking.estimatedPrice * s.cancellation.feePercent) / 100);
  }
  const set = {
    holdsSlot: false,
    cancellation: { by: actor._id, role: actor.role, reason, fee, at: new Date() },
  };
  if (booking.paymentStatus === 'paid') set.paymentStatus = 'refund_pending';
  const updated = await applyTransition(booking, 'CANCELLED', actor, set, reason);
  await logAudit(actor, 'booking.cancel', 'Booking', booking._id, { from: booking.status, fee, reason, role: actor.role });
  await notify('booking.cancelled', booking._id, { fee });
  return updated;
}

module.exports = { getSlots, createBooking, approveBooking, assignTechnician, respondToJob, advanceJob, cancelBooking };