import type { NextFunction, Request, Response } from 'express';
import { authService } from './auth.service.js';
import { ApiError } from '../../core/api-error.js';
import {
  sendErrorResponse,
  sendSuccessResponse,
} from '../../shared/handlers/response.handler.js';

const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await authService.registerUser(req.body);
    return sendSuccessResponse(res, 201, 'Succesfully created user', user);
  } catch (error) {
    if (error instanceof ApiError) {
      return sendErrorResponse(res, error.statusCode, error.message, error);
    }
    next(error);
  }
};

export const authController = {
  registerUser,
};
