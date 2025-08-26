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
  // Use the 'jwt' strategy, and since we are not using cookies, session is false.
  // Passport will automatically handle the 401 error response if authentication fails.
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
