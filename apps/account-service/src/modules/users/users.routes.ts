import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { usersController } from './users.controller.js'; // You will create this
import { wrapAsync } from '../../shared/utils/wrapAsync.js';

const router = Router();

// This route is now protected.
router.get('/me', authenticate, wrapAsync(usersController.getMe));

export default router;
