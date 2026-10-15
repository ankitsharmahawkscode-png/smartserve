const Booking = require('../models/Booking');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { todayIST, addDays } = require('../utils/dates');

exports.stats = asyncHandler(async (req, res) => {
  const today = todayIST();
  const month = today.slice(0, 7);
  const from = addDays(today, -6);
  const since = new Date(`${from}T00:00:00+05:30`);

  const [todayCount, awaiting, revenue, activeTechnicians, byStatus, daily] = await Promise.all([
    Booking.countDocuments({ date: today, status: { $ne: 'CANCELLED' } }),
    Booking.countDocuments({ status: { $in: ['PENDING', 'CONFIRMED'] } }),
    Booking.aggregate([
      { $match: { status: 'COMPLETED', date: new RegExp(`^${month}`) } },
      { $group: { _id: null, total: { $sum: '$finalPrice' }, n: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: 'technician', isActive: true }),
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, n: { $sum: 1 } } },
    ]),
  ]);

  const perDay = Object.fromEntries(daily.map((d) => [d._id, d.n]));
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(from, i);
    return { date, count: perDay[date] || 0 };
  });

  ok(res, {
    stats: {
      todayBookings: todayCount,
      awaiting,
      revenueThisMonth: revenue[0]?.total || 0,
      completedThisMonth: revenue[0]?.n || 0,
      activeTechnicians,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.n])),
      last7,
    },
  });
});