// Usage: npm run seed:admin   (reads ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD from server/.env)
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  const { ADMIN_NAME = 'Site Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) in server/.env first.');
    process.exit(1);
  }
  await connectDB();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) {
    console.log(`User ${email} already exists. Nothing changed.`);
  } else {
    await User.create({ name: ADMIN_NAME, email, role: 'admin', passwordHash: await User.hashPassword(ADMIN_PASSWORD) });
    console.log(`Admin created: ${email}`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });