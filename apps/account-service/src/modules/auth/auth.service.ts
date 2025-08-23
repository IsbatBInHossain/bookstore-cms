import type {
  loginSchemaDataType,
  registerSchemaDataType,
} from './auth.validation.js';
import { prisma } from '../../core/prisma-client.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import { ApiError } from '../../core/api-error.js';
import { logger } from '../../shared/utils/logger.js';
import { generateTokens, hashRefreshToken } from '../../shared/utils/jwt.js';

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

  const tokens = generateTokens({ email: user.email, id: user.id });
  const hashedRefreshToken = await hashRefreshToken(tokens.refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.$transaction(async tx => {
    // Delete all old refresh tokens for this user
    await tx.refreshToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Store new refresh token
    await tx.refreshToken.create({
      data: {
        tokenHash: hashedRefreshToken,
        expiresAt,
        userId: user.id,
      },
    });
  });

  const { passwordHash, ...safeUser } = user;

  return { safeUser, ...tokens };
};

export const authService = {
  registerUser,
  loginUser,
};
