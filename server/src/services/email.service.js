const { nodeEnv, isProd, smtp } = require('../config/env');

const outbox = []; // filled only when NODE_ENV=test, so tests can check what would be sent
let transporter;

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const toHtml = (text) => `<div style="font-family:Arial,sans-serif;line-height:1.5">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;

async function send({ to, subject, text }) {
  const recipients = [].concat(to).filter(Boolean);
  if (!recipients.length) return;
  if (nodeEnv === 'test') { outbox.push({ to: recipients, subject, text }); return; }
   if (!smtp.host) {
    console.log(`[email not configured] to=${recipients.join(',')} subject="${subject}"`);
    if (!isProd) console.log(text); // development only: lets you click reset links without an email account
    return;
  }
  if (!transporter) {
    transporter = require('nodemailer').createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.port === 465, auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    });
  }
  await transporter.sendMail({ from: smtp.from, to: recipients.join(','), subject, text, html: toHtml(text) });
}

module.exports = { send, outbox };