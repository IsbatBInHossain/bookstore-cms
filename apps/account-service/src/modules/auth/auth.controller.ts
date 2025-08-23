import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { sendSuccessResponse } from '../../shared/handlers/response.handler.js';

const registerUser = async (req: Request, res: Response) => {
  const user = await authService.registerUser(req.body);
  return sendSuccessResponse(res, 201, 'Succesfully created user', user);
};

const loginUser = async (req: Request, res: Response) => {
  const loginPayload = await authService.loginUser(req.body);
  return sendSuccessResponse(res, 200, 'Log in Successful', loginPayload);
};

const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const newAccessToken = await authService.refreshAccessToken(refreshToken);
  return sendSuccessResponse(res, 200, 'Successfully refreshed access token', {
    accessToken: newAccessToken,
  });
};

export const authController = {
  registerUser,
  loginUser,
  refreshAccessToken,
};
