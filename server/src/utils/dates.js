// All booking dates/times are interpreted in India Standard Time.
const OFFSET = '+05:30';
const OFFSET_MS = 330 * 60 * 1000;

const todayIST = () => new Date(Date.now() + OFFSET_MS).toISOString().slice(0, 10);
const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const slotStart = (date, slot) => new Date(`${date}T${slot.split('-')[0]}:00${OFFSET}`);
const isValidDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

module.exports = { todayIST, addDays, slotStart, isValidDate };