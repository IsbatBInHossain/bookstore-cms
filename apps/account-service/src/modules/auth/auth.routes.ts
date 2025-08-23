import { Router } from 'express';
import { validateSchema } from '../../shared/middleware/validation.middleware.js';
import { registerSchema } from './auth.validation.js';
import { authController } from './auth.controller.js';
import { wrapAsync } from '../../shared/utils/wrapAsync.js';

const router = Router();

router.post(
  '/register',
  validateSchema(registerSchema),
  wrapAsync(authController.registerUser)
);

export default router;
