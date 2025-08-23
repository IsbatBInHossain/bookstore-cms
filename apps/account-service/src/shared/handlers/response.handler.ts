import type { Response } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Sends a standardized JSON success response to the client.
 *
 * @param res - Express Response object used to send the HTTP response
 * @param statusCode - HTTP status code (e.g. 200, 201)
 * @param message - Human-readable success message
 * @param data - Optional payload to include in the response. If omitted, the `data` field is excluded.
 */
export const sendSuccessResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any
) => {
  const response: {
    status: string;
    message: string;
    data?: any;
  } = {
    status: 'success',
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

/**
 * Sends a standardized JSON error response and logs the error server-side.
 *
 * @param res - Express Response object used to send the HTTP response
 * @param statusCode - HTTP status code (e.g., 400 for validation, 401 for unauthorized, 500 for server error)
 * @param message - Human-readable error message for the client
 * @param errors - Optional structured error details
 */
export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors: object | Array<any> | null = null
) => {
  const response: {
    status: 'error';
    message: string;
    errors?: object | Array<any>;
  } = {
    status: 'error',
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // --- Server-side logging ---
  const logMessage = `Error ${statusCode}: ${message}${
    errors ? ` - ${JSON.stringify(errors)}` : ''
  }`;

  if (statusCode >= 500) {
    logger.error(message);
  } else {
    logger.warn(message);
  }

  res.status(statusCode).json(response);
};
