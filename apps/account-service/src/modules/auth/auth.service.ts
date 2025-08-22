import type { registerSchemaType } from './auth.validation.js';
import { prisma } from '../../core/prisma-client.js';
import { logger } from '../../core/server.js';
import { hashPassword } from '../../shared/utils/password.js';

export const registerUser = async (userData: registerSchemaType) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: userData.email,
    },
  });

  if (existingUser) {
    logger.warn('Invalid user. User with given email already exits.');
    throw new Error('User with given email already exits.');
  }

  const hash = await hashPassword(userData.password);

  try {
    prisma.$transaction(async tx => {
      const { email, firstName, lastName, phone } = userData;
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hash,
          roleId: 'CUSTOMER',
        },
      });

      const profile = tx.userProfile.create({
        data: {
          firstName,
          lastName: lastName ?? null,
          phone: phone ?? null,
          userId: user.id,
        },
      });
      const { passwordHash, ...safeUser } = user;
      return {
        ...safeUser,
        profile: { ...profile },
      };
    });
  } catch (err) {
    logger.warn('Failed to register user.');
    throw new Error('Failed to register user.');
  }
};
