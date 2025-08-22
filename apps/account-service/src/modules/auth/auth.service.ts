import type { registerSchemaType } from './auth.validation.js';
import { prisma } from '../../core/prisma-client.js';
import { logger } from '../../core/server.js';

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

  try {
    // prisma.$transaction(tx => {});
  } catch (error) {}
};
