import type {
  loginSchemaDataType,
  registerSchemaDataType,
} from './auth.validation.js';
import { prisma } from '../../core/prisma-client.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import { ApiError } from '../../core/api-error.js';
import { logger } from '../../shared/utils/logger.js';

const registerUser = async (userData: registerSchemaDataType) => {
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
        roleId: 'cmeo156340001uzu8fcw4kf2l',
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

const loginUser = async (userData: loginSchemaDataType) => {
  const user = await prisma.user.findUnique({
    where: {
      email: userData.email,
    },
    include: {
      profile: true,
    },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await verifyPassword(
    user.passwordHash,
    userData.password
  );
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // TODO: Create jwt token for user and send it
};

export const authService = {
  registerUser,
  loginUser,
};
