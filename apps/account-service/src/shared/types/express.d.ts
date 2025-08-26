import { User as PrismaUser } from '../../generated/prisma/index.js';
// Rename to PrismaUser to avoid namespace conflict with passport

declare global {
  namespace Express {
    export interface User extends Omit<PrismaUser, 'passwordHash' | 'roleId'> {}

    export interface Request {
      user?: User;
    }
  }
}

export {};
