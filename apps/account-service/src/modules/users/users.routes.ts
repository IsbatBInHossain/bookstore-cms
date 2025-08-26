import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { usersController } from './users.controller.js'; // You will create this
import { wrapAsync } from '../../shared/utils/wrapAsync.js';
import { validateRequest } from '../../shared/middleware/validation.middleware.js';
import { updateUserSchema } from './users.validation.js';

const router = Router();

// This route is now protected.
router.get('/me', authenticate, wrapAsync(usersController.getMe));
router.put(
  '/me',
  authenticate,
  validateRequest(updateUserSchema),
  wrapAsync(usersController.updateMe)
);

export default router;
