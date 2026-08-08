const { createApp } = require('./app');
const { connectDB } = require('./config/db');
const { env, validateEnv } = require('./config/env');

async function start() {
  try {
    validateEnv();
    await connectDB();
    // eslint-disable-next-line no-console
    console.log(`[db] connected to MongoDB`);

    const app = createApp();
    const server = app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      // eslint-disable-next-line no-console
      console.log(`\n[server] ${signal} received, shutting down...`);
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
}

start();
