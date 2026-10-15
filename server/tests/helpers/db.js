const mongoose = require('mongoose');
let mongod;

// Uses an in-memory MongoDB by default. To use a real database instead, set
// TEST_MONGO_URI to a database whose name contains "test" (it gets emptied between tests).
exports.connect = async () => {
  let uri = process.env.TEST_MONGO_URI;
  if (uri) {
    if (!/test/i.test(new URL(uri).pathname)) throw new Error('TEST_MONGO_URI database name must contain "test"');
  } else {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create({
  startupTimeout: 60000,
});
    uri = mongod.getUri();
  }
  await mongoose.connect(uri);
  // Build every index (unique email, partial unique technician slot, ...)
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
};
exports.clear = async () => {
  for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({});
};
exports.disconnect = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};