import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { usersController } from './users.controller.js';
import { wrapAsync } from '../../shared/utils/wrapAsync.js';
import { validateRequest } from '../../shared/middleware/validation.middleware.js';
import { updateUserRoleSchema, updateUserSchema } from './users.validation.js';
import { checkPermission } from '../../shared/middleware/checkPermissions.middleware.js';
import {
  PermissionAction,
  PermissionSubject,
} from '../../generated/prisma/index.js';

const router = Router();

// This route is now protected.
router.get('/me', authenticate, wrapAsync(usersController.getMe));
router.put(
  '/me',
  authenticate,
  validateRequest(updateUserSchema),
  wrapAsync(usersController.updateMe)
);

router.get(
  '/',
  authenticate,
  checkPermission(PermissionAction.READ, PermissionSubject.USER),
  wrapAsync(usersController.getAllUsers)
);

router.put(
  '/:id/role',
  authenticate,
  validateRequest(updateUserRoleSchema),
  checkPermission(PermissionAction.UPDATE, PermissionSubject.USER),
  usersController.updateRole
);

export default router;
