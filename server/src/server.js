const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { port, clientUrl } = require('./config/env');

let server;
let io;

connectDB()
  .then(() => {
    server = http.createServer(app);

    // Socket.io setup
    io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:5173',
          clientUrl,
        ].filter(Boolean),
        credentials: true,
      },
    });

    // Attach io to app so controllers can emit
    app.set('io', io);

    // Register socket handlers
    require('./socket/tracking.socket')(io);

    server.listen(port, () =>
      console.log(`API listening on :${port}`)
    );
  })
  .catch((e) => {
    console.error('Startup failed:', e.message);
    process.exit(1);
  });

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  if (!server) process.exit(0);
  if (io) io.close();
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

['SIGTERM', 'SIGINT'].forEach((s) => process.on(s, () => shutdown(s)));