const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');

exports.list = asyncHandler(async (req, res) => {
  const uid = String(req.user._id);
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const [rows, unread] = await Promise.all([
    Notification.find().sort('-createdAt').limit(limit).lean(),
    Notification.countDocuments({ readBy: { $ne: req.user._id } }),
  ]);

  ok(res, {
    unread,
    items: rows.map((n) => ({
      _id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      createdAt: n.createdAt,
      isRead: (n.readBy || []).some((id) => String(id) === uid),
    })),
  });
});

exports.markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id }, { $addToSet: { readBy: req.user._id } });
  ok(res, null, 'Marked as read');
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );
  ok(res, null, 'All marked as read');
});