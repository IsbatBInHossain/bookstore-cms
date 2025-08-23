import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express controller to catch errors automatically
 * and pass them to next().
 *
 * Ensures only valid Express handlers are passed.
 */
export const wrapAsync = <T extends RequestHandler>(fn: T): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
