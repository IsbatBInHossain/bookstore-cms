import type { Express, NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';

// Routers
import authRouter from '../modules/auth/auth.routes.js';
import {
  sendErrorResponse,
  sendSuccessResponse,
} from '../shared/handlers/response.handler.js';
import { ApiError } from './api-error.js';
import { errorHandler } from '../shared/middleware/errorHandler.middleware.js';
import { logger } from '../shared/utils/logger.js';

// Constants
const API_BASE = '/api/v1';

export const createServer = (): Express => {
  const app: Express = express();

  // Standard middleware
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get(`${API_BASE}/health`, (req: Request, res: Response) => {
    return sendSuccessResponse(res, 200, 'Hello from the Account Service', {
      service: 'account-service',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount the routers
  app.use(`${API_BASE}/auth`, authRouter);

  // Catch all route
  app.use((req, res, next) => {
    next(new ApiError(404, 'Given route not found'));
  });

  // Error handling
  app.use(errorHandler);

  return app;
};
