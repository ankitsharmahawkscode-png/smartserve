const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { todayIST } = require('../utils/dates');

exports.earnings = asyncHandler(async (req, res) => {
  const pct = req.user.technician?.commissionPct || 0;
  const base = { technician: req.user._id, status: 'COMPLETED' };
  const month = todayIST().slice(0, 7);
  const sum = (extra = {}) =>
    Booking.aggregate([{ $match: { ...base, ...extra } }, { $group: { _id: null, gross: { $sum: '$finalPrice' }, jobs: { $sum: 1 } } }]);

  const [all, thisMonth, recent] = await Promise.all([
    sum(),
    sum({ date: new RegExp(`^${month}`) }),
    Booking.find(base).sort({ date: -1, slot: -1 }).limit(50).populate('service', 'name'),
  ]);
  const earned = (gross) => Math.round((gross * pct) / 100);

  ok(res, {
    commissionPct: pct,
    totals: {
      jobs: all[0]?.jobs || 0,
      earned: earned(all[0]?.gross || 0),
      thisMonthJobs: thisMonth[0]?.jobs || 0,
      thisMonth: earned(thisMonth[0]?.gross || 0),
    },
    items: recent.map((b) => ({
      _id: b._id, bookingNo: b.bookingNo, service: b.service?.name, date: b.date, slot: b.slot,
      gross: b.finalPrice, earning: earned(b.finalPrice || 0),
    })),
  });
});