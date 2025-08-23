import type { registerSchemaType } from './auth.validation.js';
import { prisma } from '../../core/prisma-client.js';
import { logger } from '../../core/server.js';
import { hashPassword } from '../../shared/utils/password.js';
import { ApiError } from '../../core/api-error.js';

const registerUser = async (userData: registerSchemaType) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: userData.email,
    },
  });

  if (existingUser) {
    logger.warn('Invalid user. A user with given email already exits.');
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const hash = await hashPassword(userData.password);

  const newUser = prisma.$transaction(async tx => {
    const { email, firstName, lastName, phone } = userData;
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: hash,
        // TODO: Replace this hardcoded string once we have database seeding
        roleId: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    const profile = await tx.userProfile.create({
      data: {
        firstName,
        lastName: lastName ?? null,
        phone: phone ?? null,
        userId: user.id,
      },
    });
    return { ...user, profile };
  });

  return newUser;
};

export const authService = {
  registerUser,
};
