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
app.set('trust proxy', trustProxyHops); // proxies in front of the API, so rate limits see the real client IP// behind Render/Vercel proxies, so rate limits see the real client IP
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
// rawBody is kept so the Razorpay webhook signature can be checked against the exact bytes received.
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(cookieParser());
if (nodeEnv !== 'test') app.use(morgan(isProd ? 'combined' : 'dev'));
app.use('/api', noStore, apiLimiter, writeLimiter, rejectOperatorKeys);
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);
app.use('/uploads', express.static('uploads'));


module.exports = app;