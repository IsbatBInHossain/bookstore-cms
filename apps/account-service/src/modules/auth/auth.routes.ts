import { Router } from 'express';
import { validateSchema } from '../../shared/middleware/validation.middleware.js';
import { registerSchema } from './auth.validation.js';
import { authController } from './auth.controller.js';

const router = Router();

router.post(
  '/register',
  validateSchema(registerSchema),
  authController.registerUser
);

export default router;
