import type { Permission } from '../../generated/prisma/index.js';
import type { UserEntityWithPermission } from './user.js';

declare global {
  namespace Express {
    export interface User extends UserEntityWithPermission {}

    export interface Request {
      user?: User;
    }
  }
}

export {};
