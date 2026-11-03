const Notification = require('../models/Notification');

// Never throws: a failed notification must not break a booking or an application.
exports.notifyAdmins = async ({ type, title, message = '', link = '', entityId = '' }) => {
  try {
    await Notification.create({ type, title, message, link, entityId: String(entityId || '') });
  } catch (err) {
    console.error('notifyAdmins failed:', err.message);
  }
};