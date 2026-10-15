// Usage: npm run seed:demo   (safe to run twice; skips anything that already exists)
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Service = require('../models/Service');
const User = require('../models/User');
const { slugify } = require('../utils/text');

const CATALOG = {
  'AC Repair': [
    ['AC Repair and Gas Refill', 1500, 'estimate', 90, 'Inspection, diagnosis, minor repair and gas top-up. Parts are charged separately.'],
    ['AC Servicing', 599, 'fixed', 60, 'Deep clean of filters, coils and drain line.'],
  ],
  Plumbing: [
    ['Leak Repair', 450, 'estimate', 60, 'Fix leaking taps, pipes and joints.'],
    ['Tap and Fitting Installation', 350, 'fixed', 45, 'Installation of taps, showers and basic fittings.'],
  ],
  Electrical: [['Fan and Light Installation', 300, 'fixed', 45, 'Install or replace ceiling fans and light fittings.']],
  'Home Cleaning': [['Full Home Deep Cleaning', 2499, 'fixed', 240, 'Room-by-room deep clean including kitchen and bathrooms.']],
  'Appliance Repair': [['Washing Machine Repair', 499, 'estimate', 60, 'Diagnosis and repair of front and top load machines.']],
};

(async () => {
  await connectDB();
  for (const [name, services] of Object.entries(CATALOG)) {
    const slug = slugify(name);
    const category = await Category.findOneAndUpdate({ slug }, { $setOnInsert: { name, slug } }, { upsert: true, new: true });
    for (const [sName, basePrice, pricingType, durationMins, description] of services) {
      if (!(await Service.exists({ category: category._id, name: sName }))) {
        await Service.create({ category: category._id, name: sName, basePrice, pricingType, durationMins, description });
      }
    }
  }
  const email = 'technician@example.com';
  if (!(await User.exists({ email }))) {
    const password = process.env.DEMO_TECH_PASSWORD || 'Tech12345';
    await User.create({ name: 'Demo Technician', email, role: 'technician', passwordHash: await User.hashPassword(password), technician: { skills: ['AC', 'Plumbing'] } });
    console.log(`Demo technician created: ${email} / ${password}`);
  }
  console.log('Demo catalog ready');
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });