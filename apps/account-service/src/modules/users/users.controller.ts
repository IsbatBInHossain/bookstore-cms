import type { Request, Response } from 'express';
import { sendSuccessResponse } from '../../shared/handlers/response.handler.js';

const getMe = (req: Request, res: Response) => {
  const user = req.user!;

  return sendSuccessResponse(
    res,
    200,
    'User profile fetched successfully',
    user
  );
};

const updateMe = (req: Request, res: Response) => {
  // This is a placeholder for the actual update logic
  return sendSuccessResponse(res, 200, 'User updated successfully', {});
};

export const usersController = {
  getMe,
  updateMe,
};
