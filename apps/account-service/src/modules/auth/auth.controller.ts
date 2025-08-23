import type { NextFunction, Request, Response } from 'express';
import type { registerSchemaType } from './auth.validation.js';
import { authService } from './auth.service.js';
import { ApiError } from '../../core/api-error.js';

export const registerUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userData = req.body as registerSchemaType;

  try {
    const user = await authService.registerUser(userData);
    res.status(201).json({
      staus: 'Success',
      message: 'Created new user',
      data: user,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'Failed',
        message: error.message,
      });
    }
    next(error);
  }
};
