import type { Request, Response } from 'express';
import { sendSuccessResponse } from '../../shared/handlers/response.handler.js';

const getMe = (req: Request, res: Response) => {
  const user = req.user!;

  // Destructure to remove the password hash.
  const { passwordHash, ...safeUser } = user;

  return sendSuccessResponse(
    res,
    200,
    'User profile fetched successfully',
    safeUser
  );
};

export const usersController = {
  getMe,
};
