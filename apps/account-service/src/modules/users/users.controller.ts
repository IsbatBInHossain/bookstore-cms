import type { Request, Response } from 'express';
import {
  sendErrorResponse,
  sendSuccessResponse,
} from '../../shared/handlers/response.handler.js';
import { userService } from './users.service.js';

const getMe = (req: Request, res: Response) => {
  const user = req.user!;

  return sendSuccessResponse(
    res,
    200,
    'User profile fetched successfully',
    user
  );
};

const updateMe = async (req: Request, res: Response) => {
  const data = req.body;
  const userId = req.user?.id;
  if (!userId) {
    return sendErrorResponse(res, 401, 'Unauthorized');
  }

  const updatedUserData = await userService.updateMyProfile(
    userId,
    data,
    req.app.locals.prisma
  );

  return sendSuccessResponse(
    res,
    200,
    'User updated successfully',
    updatedUserData
  );
};

const getAllUsers = async (req: Request, res: Response) => {
  const userData = await userService.getAllUsers(req.app.locals.prisma);
  return sendSuccessResponse(res, 200, 'Fetched all users', userData);
};

export const usersController = {
  getMe,
  updateMe,
  getAllUsers,
};
