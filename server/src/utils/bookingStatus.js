const ApiError = require('./ApiError');

const TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'CONFIRMED', 'CANCELLED'], // CONFIRMED = technician rejected, needs reassigning
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];
const SLOT_HOLDING = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];

const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);
function assertTransition(from, to) {
  if (!canTransition(from, to)) throw new ApiError(409, `A booking cannot move from ${from} to ${to}`);
}

module.exports = { TRANSITIONS, ACTIVE_STATUSES, SLOT_HOLDING, canTransition, assertTransition };