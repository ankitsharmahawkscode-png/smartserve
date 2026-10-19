const { nodeEnv, isProd } = require('../config/env');
const axios = require('axios'); // npm install axios (agar nahi hai to)

const outbox = []; // test ke liye
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const toHtml = (text) => `<div style="font-family:Arial,sans-serif;line-height:1.5">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;

async function send({ to, subject, text }) {
  const recipients = [].concat(to).filter(Boolean);
  if (!recipients.length) return;

  if (nodeEnv === 'test') {
    outbox.push({ to: recipients, subject, text });
    return;
  }

  // Brevo API Key check
  if (!process.env.BREVO_API_KEY) {
    console.log(`[email not configured] to=${recipients.join(',')} subject="${subject}"`);
    return;
  }

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'SmartServe',
          email: process.env.SMTP_USER || 'your-verified-gmail@gmail.com', // Jo Brevo pe verify kiya hai
        },
        to: recipients.map(email => ({ email })),
        subject: subject,
        htmlContent: toHtml(text),
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`Email sent to ${recipients.join(',')}`);
  } catch (error) {
    console.error('Brevo email failed:', error.response?.data || error.message);
    // Production me error throw mat karo warna app crash hoga, bas log karo
  }
}

module.exports = { send, outbox };