import type { NextFunction, Request, Response } from 'express';
import { authService } from './auth.service.js';
import { sendSuccessResponse } from '../../shared/handlers/response.handler.js';

const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await authService.registerUser(req.body);
  return sendSuccessResponse(res, 201, 'Succesfully created user', user);
};

export const authController = {
  registerUser,
};
