const mongoose = require('mongoose');
const { env } = require('./env');

mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB. Reused by the server bootstrap and the seed script.
 * @param {string} [uri] Optional override (used by tests / seed).
 */
async function connectDB(uri = env.mongoUri) {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  return conn;
}

async function disconnectDB() {
  await mongoose.connection.close();
}

module.exports = { connectDB, disconnectDB };
