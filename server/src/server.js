const app = require('./app');
const connectDB = require('./config/db');
const { port } = require('./config/env');

connectDB()
  .then(() => app.listen(port, () => console.log(`API listening on :${port}`)))
  .catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
