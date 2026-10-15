const Setting = require('../models/Setting');

const DEFAULTS = {
  slots: ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'],
  slotCapacity: 3, // max active bookings per date+slot across the business
  maxAdvanceDays: 30,
  minLeadHours: 2,
  codEnabled: true,
  cancellation: { freeHoursBefore: 24, feePercent: 20 },
};

async function getSettings() {
  const rows = await Setting.find();
  const out = { ...DEFAULTS };
  for (const r of rows) if (r.key in DEFAULTS) out[r.key] = r.value;
  return out;
}

async function updateSettings(patch) {
  for (const [key, value] of Object.entries(patch)) {
    await Setting.updateOne({ key }, { $set: { value } }, { upsert: true });
  }
  return getSettings();
}

module.exports = { DEFAULTS, getSettings, updateSettings };