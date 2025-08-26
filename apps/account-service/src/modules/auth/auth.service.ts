import type {
  loginSchemaDataType,
  registerSchemaDataType,
} from './auth.validation.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import { ApiError } from '../../core/api-error.js';
import { logger } from '../../shared/utils/logger.js';
import {
  generateTokens,
  hashRefreshToken,
  verifyRefreshToken,
  verifyRefreshTokenHash,
} from '../../shared/utils/tokens.util.js';
import type { PrismaClient } from '../../generated/prisma/index.js';

/**
 * Registers a new user in the system
 *
 * @param userData - The user registration data containing email, password, and profile information
 * @returns Promise that resolves to the created user object with profile, excluding sensitive data
 * @throws {ApiError} 409 - If a user with the provided email already exists
 */
const registerUser = async (
  userData: registerSchemaDataType,
  prisma: PrismaClient
) => {
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

  const newUser = await prisma.$transaction(async tx => {
    const { email, firstName, lastName, phone } = userData;
    const customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });

    if (!customerRole) {
      // This should never happen in our test, but it's good practice.
      throw new Error('CUSTOMER role not found. Please seed the database.');
    }
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: hash,
        roleId: customerRole.id,
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
const loginUser = async (
  userData: loginSchemaDataType,
  prisma: PrismaClient
) => {
  const user = await prisma.user.findUnique({
    where: {
      email: userData.email,
    },
    include: {
      profile: true,
      role: true,
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

  const { passwordHash, roleId, ...safeUser } = user;

  return { user: safeUser, tokens };
};

/**
 * Logsout a user and deletes their refresh tokens from db
 *
 * @param providedRefreshToken - The refresh token string from the client.
 * @returns void
 * @throws {ApiError} 401 - If the refresh token is invalid, expired, or has already been used.
 */
const logoutUser = async (
  providedRefreshToken: string,
  prisma: PrismaClient
) => {
  logger.info(`Provide token: ${providedRefreshToken}`);
  // Verify the JWT signature and expiry
  const decodedPayload = verifyRefreshToken(providedRefreshToken);
  if (!decodedPayload) {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }

  // Delete all refreshTokens for the user
  await prisma.refreshToken.deleteMany({
    where: { userId: decodedPayload.id },
  });
};

/**
 * Refreshes access token and Refresh token using a valid refresh token.
 * Implements refresh token rotation for enhanced security.
 *
 * @param providedRefreshToken - The refresh token string from the client.
 * @returns A promise that resolves to an object containing the new accessToken and refreshToken.
 * @throws {ApiError} 401 - If the refresh token is invalid, expired, or has already been used.
 */
const refreshTokens = async (
  providedRefreshToken: string,
  prisma: PrismaClient
) => {
  logger.info(`Provide token: ${providedRefreshToken}`);
  // Verify the JWT signature and expiry
  const decodedPayload = verifyRefreshToken(providedRefreshToken);
  if (!decodedPayload) {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }

  // Find the ONE active refresh token associated with the user.
  const storedToken = await prisma.refreshToken.findFirst({
    where: { userId: decodedPayload.id },
  });

  if (!storedToken) {
    throw new ApiError(401, 'Refresh token not found or has been invalidated.');
  }

  // Compare the provided token with the hashed token from the database.
  const isTokenValid = await verifyRefreshTokenHash(
    providedRefreshToken,
    storedToken.tokenHash
  );

  if (!isTokenValid) {
    // TODO: Invalid all session
    throw new ApiError(401, 'Invalid refresh token.');
  }

  // --- REFRESH TOKEN ROTATION ---
  const newTokens = generateTokens({
    email: decodedPayload.email,
    id: decodedPayload.id,
  });
  const newHashedRefreshToken = await hashRefreshToken(newTokens.refreshToken);

  const refreshTokenExpiresMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const newExpiresAt = new Date(Date.now() + refreshTokenExpiresMs);

  // Update the existing token record
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: {
      tokenHash: newHashedRefreshToken,
      expiresAt: newExpiresAt,
    },
  });

  // Return the new pair of tokens to the client.
  return newTokens;
};

export const authService = {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokens,
};
