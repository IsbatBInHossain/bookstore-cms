import type { Express, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';

// Routers
import authRouter from '../modules/auth/auth.routes.js';
import usersRouter from '../modules/users/users.routes.js';
import { sendSuccessResponse } from '../shared/handlers/response.handler.js';
import { ApiError } from './api-error.js';
import { errorHandler } from '../shared/middleware/errorHandler.middleware.js';
import passport from 'passport';
import jwtStrategy from './passport.js';
import type { PrismaClient } from '../generated/prisma/index.js';

// Constants
const API_BASE = '/api/v1';

export const createServer = (prisma: PrismaClient): Express => {
  const app: Express = express();

  // Attach prisma to app
  app.locals.prisma = prisma;

  // console.log(`DATABASE_URL in app ${process.env.DATABASE_URL}`);
  // console.log('JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET);
  // Standard middleware
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- Initialize Passport ---
  app.use(passport.initialize());
  passport.use(jwtStrategy);

  // Health check endpoint
  app.get(`${API_BASE}/health`, (req: Request, res: Response) => {
    return sendSuccessResponse(res, 200, 'Hello from the Account Service', {
      service: 'account-service',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount the routers
  app.use(`${API_BASE}/auth`, authRouter);
  app.use(`${API_BASE}/users`, usersRouter);

  // Catch all route
  app.use((req, res, next) => {
    next(new ApiError(404, 'Given route not found'));
  });

  // Error handling
  app.use(errorHandler);

  return app;
};
