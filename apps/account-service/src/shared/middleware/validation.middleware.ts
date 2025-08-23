import { ZodSchema, ZodError } from 'zod';
import type { Response, Request, NextFunction } from 'express';
import { sendErrorResponse } from '../handlers/response.handler.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to validate incoming request data using Zod schema
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateSchema =
  (schema: unknown) => (req: Request, res: Response, next: NextFunction) => {
    if (!(schema instanceof ZodSchema)) {
      logger.error('Invalida or missing zod schema');
      return sendErrorResponse(res, 500, 'Internal server error');
    }

    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      let formattedErrors = null;
      let errorMessage = 'Validation failed';
      if (err instanceof ZodError && err.errors && Array.isArray(err.errors)) {
        formattedErrors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
      } else {
        errorMessage =
          'An unexpected error occurred during request validation.';
      }
      logger.error(errorMessage);
      sendErrorResponse(res, 400, errorMessage, formattedErrors);
    }
  };
