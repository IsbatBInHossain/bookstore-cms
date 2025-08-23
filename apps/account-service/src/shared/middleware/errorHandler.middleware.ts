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
};
