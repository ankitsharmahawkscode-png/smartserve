const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { clientUrl, nodeEnv, isProd, trustProxyHops } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, writeLimiter, rejectOperatorKeys, noStore } = require('./middleware/security');

const app = express();
// Behind Render/Vercel proxies, so rate limits see the real client IP
app.set('trust proxy', trustProxyHops);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: 'https://smartserve-wine.vercel.app', credentials: true }));

// rawBody is kept so the Razorpay webhook signature can be checked against the exact bytes received.
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(cookieParser());
if (nodeEnv !== 'test') app.use(morgan(isProd ? 'combined' : 'dev'));

// TEMPORARY: open /api/v1/version to see which build is live. Delete after the test.
app.get('/api/v1/version', (req, res) => res.json({ build: 'tracking-3' }));

app.use('/api', noStore, apiLimiter, writeLimiter, rejectOperatorKeys);
app.use('/api/v1', routes);
app.use('/uploads', express.static('uploads'));

// These two must stay last
app.use(notFound);
app.use(errorHandler);

module.exports = app;