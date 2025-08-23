import { createLogger } from '@repo/logger';
import type { Express, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';

// Routers
import authRouter from '../modules/auth/auth.routes.js';

// Constants
const API_BASE = '/account-service/api/v1';

// Global logger
export const logger = createLogger({ service: 'account-service' });

export const createServer = (): Express => {
  const app: Express = express();

  // Standard middleware
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // A simple test route
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Hello from the Account Service!',
      service: 'account-service',
    });
  });

  // Mount the routers
  app.use(`${API_BASE}/auth`, authRouter);

  return app;
};
