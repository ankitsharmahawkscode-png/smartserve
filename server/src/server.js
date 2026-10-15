const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const { port } = require('./config/env');

let server;
connectDB()
  .then(() => { server = app.listen(port, () => console.log(`API listening on :${port}`)); })
  .catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });

// Hosts send SIGTERM on every deploy: finish in-flight requests, then close the database cleanly.
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  if (!server) process.exit(0);
  server.close(async () => { await mongoose.disconnect(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
};
['SIGTERM', 'SIGINT'].forEach((s) => process.on(s, () => shutdown(s)));