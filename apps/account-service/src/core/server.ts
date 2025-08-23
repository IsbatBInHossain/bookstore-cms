import { createLogger } from '@repo/logger';
import type { Express, NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';

// Routers
import authRouter from '../modules/auth/auth.routes.js';
import {
  sendErrorResponse,
  sendSuccessResponse,
} from '../shared/handlers/responseHandlers.js';
import { ApiError } from './api-error.js';

// Constants
const API_BASE = '/api/v1';
const NODE_ENV = process.env.NODE_ENV || 'development'; //!Change on production

// Global logger
export const logger = createLogger({ service: 'account-service' });

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
  app.use(
    (
      err: unknown | ApiError,
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      if (!(err instanceof ApiError)) {
        const err = new ApiError(500, 'Something went wrong', false);
        return sendErrorResponse(res, err.statusCode, err.message);
      } else {
        if (err?.isOperational) {
          logger.warn(err);
        } else {
          logger.error(err);
        }
        return sendErrorResponse(res, err.statusCode, err.message);
      }
    }
  );

  return app;
};
