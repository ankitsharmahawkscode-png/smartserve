// Usage: npm run preflight            checks files, exports, configuration and that the API loads
//        npm run preflight -- --db    also connects to MONGO_URI and checks the data
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const problems = [];
const warnings = [];
const fail = (msg) => problems.push(msg);

const FILES = [
  'app.js', 'server.js', 'config/env.js', 'config/db.js',
  ...['User', 'Category', 'Service', 'Booking', 'Payment', 'Review', 'Setting', 'AuditLog', 'Counter', 'ContactMessage'].map((m) => `models/${m}.js`),
  ...['settings', 'booking', 'payment', 'razorpay', 'email', 'notify'].map((s) => `services/${s}.service.js`),
  ...['auth', 'me', 'catalog', 'booking', 'tech', 'admin.catalog', 'admin.ops', 'admin.stats', 'admin.finance', 'admin.audit', 'payment', 'review', 'contact', 'tech.earnings'].map((c) => `controllers/${c}.controller.js`),
  ...['index', 'public', 'auth', 'me', 'booking', 'payment', 'review', 'admin', 'technician'].map((r) => `routes/${r}.routes.js`).map((f) => f.replace('index.routes', 'index')),
  'middleware/auth.js', 'middleware/validate.js', 'middleware/validId.js', 'middleware/errorHandler.js', 'middleware/security.js',
  'utils/ApiError.js', 'utils/asyncHandler.js', 'utils/respond.js', 'utils/paginate.js', 'utils/text.js', 'utils/dates.js', 'utils/bookingStatus.js', 'utils/audit.js', 'utils/tokens.js',
  'validators/auth.validators.js', 'validators/domain.validators.js', 'scripts/seedAdmin.js', 'scripts/seedDemo.js',
    'routes/seo.routes.js', 'controllers/seo.controller.js', 'utils/seo.js',
];

const EXPORTS = {
  'middleware/security.js': ['limiter', 'apiLimiter', 'authLimiter', 'refreshLimiter', 'strictLimiter', 'resetLimiter','writeLimiter', 'contactLimiter', 'rejectOperatorKeys', 'requireTrustedOrigin', 'noStore'],
  'validators/domain.validators.js': ['profileSchema', 'addressSchema', 'serviceSchema', 'createBookingSchema', 'orderSchema', 'verifyPaymentSchema', 'reviewSchema', 'reviewVisibilitySchema', 'changePasswordSchema', 'contactSchema', 'settingsSchema'],
  'controllers/auth.controller.js': ['register', 'login', 'refresh','forgotPassword', 'resetPassword', 'logout', 'me'],
  'controllers/me.controller.js': ['get', 'update', 'changePassword', 'addAddress', 'updateAddress', 'removeAddress'],
  'controllers/contact.controller.js': ['create', 'list'],
  'controllers/admin.audit.controller.js': ['list'],
  'controllers/admin.stats.controller.js': ['stats'],
  'controllers/admin.finance.controller.js': ['listPayments', 'refund', 'listReviews', 'setReviewHidden'],
  'controllers/payment.controller.js': ['createOrder', 'verify', 'mine', 'webhook'],
  'controllers/review.controller.js': ['create', 'mine', 'forService'],
  'controllers/tech.earnings.controller.js': ['earnings'],
  'controllers/catalog.controller.js': ['categories', 'services', 'service', 'slots', 'publicSettings'],
  'config/env.js': ['cookieSameSite', 'trustProxyHops', 'razorpay', 'smtp', 'appName'],
  'validators/auth.validators.js': ['registerSchema', 'loginSchema', 'forgotPasswordSchema', 'resetPasswordSchema'],
    'controllers/seo.controller.js': ['sitemap', 'robots'],
};

(async () => {
  console.log('Checking files...');
  const missing = FILES.filter((f) => !fs.existsSync(path.join(root, f)));
  missing.forEach((f) => fail(`Missing file: server/src/${f}`));

  if (!missing.length) {
    console.log('Checking exports...');
    for (const [file, names] of Object.entries(EXPORTS)) {
      let mod;
      try { mod = require(path.join(root, file)); } catch (e) { fail(`Cannot load server/src/${file}: ${e.message}`); continue; }
      names.filter((n) => mod[n] === undefined).forEach((n) => fail(`server/src/${file} is missing "${n}"`));
    }
    try {
      const User = require(path.join(root, 'models/User.js'));
      ['failedLogins', 'lockUntil', 'tokenVersion', 'passwordHash', 'refreshTokens'].filter((p) => !User.schema.path(p)).forEach((p) => fail(`User model is missing the "${p}" field`));
    } catch (e) { fail(`Cannot inspect the User model: ${e.message}`); }
    if (!problems.length) {
      console.log('Loading the API...');
      try { require(path.join(root, 'app.js')); } catch (e) { fail(`The API failed to load: ${e.message}`); }
    }
  } else {
    warnings.push('Skipped export and load checks because files are missing. Add the missing files first.');
  }

  const env = require(path.join(root, 'config/env.js'));
  if (!process.env.JWT_ACCESS_SECRET || /^change-me/.test(process.env.JWT_ACCESS_SECRET)) warnings.push('JWT_ACCESS_SECRET is not set to a real secret (fine for local use, never in production)');
  if (!process.env.JWT_REFRESH_SECRET || /^change-me/.test(process.env.JWT_REFRESH_SECRET)) warnings.push('JWT_REFRESH_SECRET is not set to a real secret');
  if (!env.razorpay.enabled) warnings.push('Razorpay keys are missing or placeholders: online payment will show as "not available"');
  if (!env.razorpay.webhookSecret) warnings.push('RAZORPAY_WEBHOOK_SECRET is empty: payment webhooks will be rejected');
  if (!env.smtp.host) warnings.push('SMTP_HOST is empty: emails are printed in the terminal, not sent');
  if (!env.adminNotifyEmail) warnings.push('ADMIN_NOTIFY_EMAIL is empty: the owner gets no email for new bookings or contact messages');
  if (env.isProd && /localhost|127\.0\.0\.1/.test(env.clientUrl)) fail('CLIENT_URL points at localhost in production');
  if (env.isProd && /127\.0\.0\.1|localhost/.test(env.mongoUri)) fail('MONGO_URI points at localhost in production');

  if (process.argv.includes('--db')) {
    console.log('Checking the database...');
    try {
      const mongoose = require('mongoose');
      await require(path.join(root, 'config/db.js'))();
      const count = (name) => mongoose.connection.collection(name).countDocuments();
      const admins = await mongoose.connection.collection('users').countDocuments({ role: 'admin' });
      if (!admins) warnings.push('No administrator exists yet: run npm run seed:admin');
      console.log(`  users: ${await count('users')}, services: ${await count('services')}, bookings: ${await count('bookings')}`);
      if (!(await count('services'))) warnings.push('No services yet: add some in the admin panel or run npm run seed:demo');
      await mongoose.disconnect();
    } catch (e) { fail(`Database check failed: ${e.message}`); }
  }

  console.log('');
  warnings.forEach((w) => console.log(`  warning: ${w}`));
  problems.forEach((p) => console.log(`  PROBLEM: ${p}`));
  console.log(problems.length ? `\n${problems.length} problem(s) found. Fix them before deploying.` : '\nPreflight passed: nothing is missing.');
  process.exit(problems.length ? 1 : 0);
})();