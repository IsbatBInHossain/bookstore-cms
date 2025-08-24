import { Router } from 'express';
import { validateRequest } from '../../shared/middleware/validation.middleware.js';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from './auth.validation.js';
import { authController } from './auth.controller.js';
import { wrapAsync } from '../../shared/utils/wrapAsync.js';

const router = Router();

router.post(
  '/register',
  validateRequest(registerSchema),
  wrapAsync(authController.registerUser)
);

router.post(
  '/login',
  validateRequest(loginSchema),
  wrapAsync(authController.loginUser)
);

router.post(
  '/logout',
  validateRequest(refreshTokenSchema),
  wrapAsync(authController.logoutUser)
);

router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  wrapAsync(authController.refreshTokens)
);

export default router;
