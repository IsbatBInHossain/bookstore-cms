import passport from 'passport';
import type { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../handlers/response.handler.js';

/**
Middleware to protect routes by requiring a valid JWT access token.
*/
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Use the 'jwt' strategy for authentication with custom callback to handle errors and user info
  passport.authenticate(
    'jwt',
    { session: false },
    (
      err: unknown,
      user: Express.User | false,
      info: { message?: string } | undefined
    ) => {
      if (err) return next(err);

      if (!user) {
        return sendErrorResponse(res, 401, 'Unauthorized', info);
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};
