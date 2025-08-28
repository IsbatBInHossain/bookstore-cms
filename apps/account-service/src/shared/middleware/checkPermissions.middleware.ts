import type { Request, Response, NextFunction } from 'express';
import type {
  PermissionAction,
  PermissionSubject,
} from '../../generated/prisma/index.js';
import { ApiError } from '../../core/api-error.js';

export const checkPermission =
  (action: PermissionAction, subject: PermissionSubject) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const hasPermission = user.role.permissions.some(
      rp => rp.permission.action === action && rp.permission.subject === subject
    );

    if (!hasPermission) {
      return next(new ApiError(403, 'Forbidden'));
    }

    next();
  };
