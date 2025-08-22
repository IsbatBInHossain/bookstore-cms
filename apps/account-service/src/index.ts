import dotenv from 'dotenv';
import { createServer, logger } from './core/server.js';
import { type Express } from 'express';

dotenv.config();
const app: Express = createServer();
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
