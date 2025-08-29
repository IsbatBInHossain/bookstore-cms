import { ZodSchema, ZodError } from 'zod';
import type { Response, Request, NextFunction } from 'express';
import { ApiError } from '../../core/api-error.js';

/**
 * Middleware to validate incoming request data using Zod schema
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateRequest =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError && err.errors && Array.isArray(err.errors)) {
        const formattedErrors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        let errorMessage;
        if (formattedErrors.length > 0) {
          errorMessage = formattedErrors[0]?.message;
        }
        const error = new ApiError(
          400,
          errorMessage || 'Validation failed',
          true
        );
        // Attach the detailed errors to the error object for the handler to use
        (error as any).errors = formattedErrors;
        next(error);
      } else {
        // For unexpected errors during validation
        next(
          new ApiError(
            500,
            'An unexpected error occurred during request validation.'
          )
        );
      }
    }
  };
