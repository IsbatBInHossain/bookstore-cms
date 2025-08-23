import type { NextFunction, Request, Response } from 'express';
import type { registerSchemaType } from './auth.validation.js';
import { authService } from './auth.service.js';
import { ApiError } from '../../core/api-error.js';
import {
  sendErrorResponse,
  sendSuccessResponse,
} from '../../shared/handlers/responseHandlers.js';

const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userData = req.body as registerSchemaType;

  try {
    const user = await authService.registerUser(userData);
    sendSuccessResponse(res, 201, 'Succesfully created user', user);
  } catch (error) {
    if (error instanceof ApiError) {
      sendErrorResponse(res, error.statusCode, error.message, error);
    }
    next(error);
  }
};

export const authController = {
  registerUser,
};
