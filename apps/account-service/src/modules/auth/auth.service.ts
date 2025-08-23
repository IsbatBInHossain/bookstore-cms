import type {
  loginSchemaDataType,
  registerSchemaDataType,
} from './auth.validation.js';
import { prisma } from '../../core/prisma-client.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import { ApiError } from '../../core/api-error.js';
import { logger } from '../../shared/utils/logger.js';
import {
  generateTokens,
  hashRefreshToken,
  verifyRefreshToken,
  verifyRefreshTokenHash,
} from '../../shared/utils/tokens.util.js';

/**
 * Registers a new user in the system
 *
 * @param userData - The user registration data containing email, password, and profile information
 * @returns Promise that resolves to the created user object with profile, excluding sensitive data
 * @throws {ApiError} 409 - If a user with the provided email already exists
 */
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

/**
 * Authenticates a user and generates access/refresh tokens
 *
 * @param userData - The user login credentials containing email and password
 * @returns Promise that resolves to an object containing the user data (without password) and authentication tokens
 * @throws {ApiError} 401 - If the email doesn't exist or password is incorrect
 */
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

/**
 * Refreshes access and refresh tokens using a valid refresh token
 *
 * @param refreshToken - The refresh token string used to generate new tokens
 * @returns Promise that resolves to an object containing new access and refresh tokens
 * @throws {ApiError} 401 - If the refresh token is invalid, expired, or not found
 */
const refreshAccessToken = async (refreshToken: string) => {
  const user = verifyRefreshToken(refreshToken);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });

  if (!existingUser) {
    throw new ApiError(404, 'User not found');
  }

  const currentTokens = await prisma.refreshToken.findMany({
    where: {
      userId: existingUser.id,
    },
  });

  if (currentTokens.length === 0) {
    throw new ApiError(401, 'Invalid credentials');
  }

  let tokenMatched = false;
  for (let token of currentTokens) {
    if (await verifyRefreshTokenHash(refreshToken, token.tokenHash)) {
      tokenMatched = true;
      break;
    }
  }

  if (!tokenMatched) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const newTokens = generateTokens({
    email: existingUser.email,
    id: existingUser.id,
  });

  return newTokens.accessToken;
};

export const authService = {
  registerUser,
  loginUser,
  refreshAccessToken,
};
