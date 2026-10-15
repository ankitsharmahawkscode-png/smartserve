const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { paging, pageOf } = require('../utils/paginate');
const email = require('../services/email.service');
const { adminNotifyEmail, appName } = require('../config/env');

const THANKS = 'Thank you. We will get back to you soon.';

exports.create = asyncHandler(async (req, res) => {
  const { website, ...data } = req.body;
  if (website) return ok(res, null, THANKS, 201); // hidden field filled in: a bot. Pretend it worked, store nothing.
  await ContactMessage.create(data); // saved first, so nothing is lost if email is down
  try {
    await email.send({
      to: adminNotifyEmail,
      subject: `${appName}: new message from ${data.name}`,
      text: `From: ${data.name} <${data.email}>${data.phone ? `\nPhone: ${data.phone}` : ''}\n\n${data.message}`,
    });
  } catch (e) {
    console.error('Contact email failed:', e.message);
  }
  ok(res, null, THANKS, 201);
});

exports.list = asyncHandler(async (req, res) => {
  const p = paging(req.query, 20);
  const [items, total] = await Promise.all([
    ContactMessage.find().sort('-createdAt').skip(p.skip).limit(p.limit),
    ContactMessage.countDocuments(),
  ]);
  ok(res, pageOf(items, total, p));
});