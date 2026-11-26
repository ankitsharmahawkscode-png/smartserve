const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { nodeEnv, isProd, trustProxyHops, clientUrl } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, writeLimiter, rejectOperatorKeys, noStore } = require('./middleware/security');

const app = express();

// Behind Render/Vercel proxies, so rate limits see the real client IP
app.set('trust proxy', trustProxyHops);
app.disable('x-powered-by');
app.use(helmet());

// CORS setup
app.use(cors({ 
  origin: ['http://localhost:5173', 'https://smartserve-wine.vercel.app', clientUrl].filter(Boolean), 
  credentials: true 
}));

// rawBody is kept so the Razorpay webhook signature can be checked against the exact bytes received.
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(cookieParser());
if (nodeEnv !== 'test') app.use(morgan(isProd ? 'combined' : 'dev'));

// Temporary: open /api/v1/version to see which build is live.
app.get('/api/v1/version', (req, res) => res.json({ build: 'media-1' }));

// Public images
app.get('/api/v1/ping-media', (req, res) => res.json({ ok: true, build: 'media-2', at: new Date().toISOString() }));
app.use('/api/v1/media', require('./routes/media.routes'));

app.use('/api', noStore, apiLimiter, writeLimiter, rejectOperatorKeys);

// 👇 THIS IS THE ONLY LINE NEEDED FOR YOUR ROUTES 👇
// It automatically picks up /shop, /corporate, /gift-cards from routes/index.js
app.use('/api/v1', routes); 

app.use('/uploads', express.static('uploads'));

// These two must stay last
app.use(notFound);
app.use(errorHandler);

module.exports = app;