const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Inject test env before any app modules load config.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-value-1234567890';
process.env.JWT_EXPIRES_IN = '1h';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  // Wipe all collections between tests for isolation.
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});
