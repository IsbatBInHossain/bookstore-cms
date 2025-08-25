import { createServer } from './core/server.js';
import { type Express } from 'express';
import { logger } from './shared/utils/logger.js';
import { prisma } from '../src/core/prisma-client.js';

const app: Express = createServer(prisma);
const port = process.env.PORT || 3001;

const main = async () => {
  try {
    app.listen(port, () => {
      logger.info(
        `[account-service]: Server is running at http://localhost:${port}`
      );
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

main();
