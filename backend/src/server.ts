import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma, pool } from './config/database.js';
import { IncidentLifecycleJob } from './modules/incidents/incident-lifecycle.job.js';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 GuzoMate backend server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`📖 API Documentation available at http://localhost:${env.PORT}/api/v1/docs`);

  // Start background overdue incident expiration worker (runs every 5 minutes)
  IncidentLifecycleJob.start(5 * 60 * 1000);
});

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  IncidentLifecycleJob.stop();

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Prisma client disconnected.');

      await pool.end();
      logger.info('Database pool closed.');

      process.exit(0);
    } catch (error) {
      logger.error('Error during database disconnection:', error);
      process.exit(1);
    }
  });

  // Force close if graceful shutdown takes longer than 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { server };
