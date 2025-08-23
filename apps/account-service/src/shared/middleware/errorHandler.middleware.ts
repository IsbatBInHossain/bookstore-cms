import { ApiError } from '../../core/api-error.js';
import type { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../handlers/response.handler.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: unknown | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else {
    apiError = new ApiError(500, 'Something went wrong', false);
    // Log the original, unknown error for debugging
    logger.error(err, 'An unknown error occurred');
  }

  if (apiError.isOperational) {
    logger.warn(apiError.message);
  } else {
    // For non-operational errors log full error log
    logger.error(apiError);
  }

  // Check if there are detailed validation errors attached
  const detailedErrors = (apiError as any).errors || null;

  return sendErrorResponse(
    res,
    apiError.statusCode,
    apiError.message,
    detailedErrors
  );
};
