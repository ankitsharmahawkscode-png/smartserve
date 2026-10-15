require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

if (isProd) {
  const missing = ['MONGO_URI', 'CLIENT_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
}

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

module.exports = {
  nodeEnv,
  isProd,
  appName: process.env.APP_NAME || 'Technical Workers',
  port: Number(process.env.PORT) || 5000,
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartserve',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || (nodeEnv === 'test' ? 4 : 12),
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL || '',
  // Number of proxies in front of the API. 1 on Render alone; 2 when Vercel proxies /api to Render.
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS) || 1,
  // 'lax' works when the frontend and API share one site (Vercel proxy, or sibling subdomains).
  // Use 'none' only if they sit on different sites; Safari blocks those cookies.
  cookieSameSite: ['lax', 'strict', 'none'].includes(process.env.COOKIE_SAMESITE) ? process.env.COOKIE_SAMESITE : 'lax',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  razorpay: {
    keyId,
    keySecret,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    // The placeholder values from .env.example do not count as configured.
    enabled: /^rzp_(test|live)_[A-Za-z0-9]{8,}$/.test(keyId) && keySecret.length >= 10 && keySecret !== 'xxxxx',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Technical Workers <no-reply@example.com>',
  },
};