import passport from 'passport';
import type { Request, Response, NextFunction } from 'express';
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
  passport.authenticate('jwt', { session: false })(req, res, next);
};
