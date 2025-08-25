import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { sendSuccessResponse } from '../../shared/handlers/response.handler.js';
import type { PrismaClient } from '../../generated/prisma/index.js';

const registerUser = async (req: Request, res: Response) => {
  const user = await authService.registerUser(req.body, req.app.locals.prisma);
  return sendSuccessResponse(res, 201, 'Succesfully created user', user);
};

const loginUser = async (req: Request, res: Response) => {
  const loginPayload = await authService.loginUser(
    req.body,
    req.app.locals.prisma
  );
  return sendSuccessResponse(res, 200, 'Logged in Successfully', loginPayload);
};

const logoutUser = async (req: Request, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  await authService.logoutUser(req.body.refreshToken, prisma);
  return res.status(204).send();
};

const refreshTokens = async (req: Request, res: Response) => {
  const newTokens = await authService.refreshTokens(
    req.body.refreshToken,
    req.app.locals.prisma
  );
  return sendSuccessResponse(res, 200, 'Successfully Refreshed Tokens', {
    ...newTokens,
  });
};

export const authController = {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokens,
};
