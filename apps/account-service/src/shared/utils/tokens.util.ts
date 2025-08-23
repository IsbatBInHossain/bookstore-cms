import jwt from 'jsonwebtoken';
import {
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} from '../constants/index.js';
import argon2 from 'argon2';

export interface UserPayload {
  id: string;
  email: string;
}

/**
 * Generates an access and refresh token for a given user payload.
 */
export const generateTokens = (payload: UserPayload) => {
  // Access process.env here for safety
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error(
      'JWT secret keys are not defined in environment variables.'
    );
  }

  const accessToken = jwt.sign(payload, accessSecret, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

/**
 * Verifies an access token and returns the decoded payload.
 */
export const verifyAccessToken = (token: string): UserPayload | null => {
  try {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) return null;
    return jwt.verify(token, accessSecret) as UserPayload;
  } catch {
    return null;
  }
};

/**
 * Verifies an refresh token and returns the decoded payload.
 */
export const verifyRefreshToken = (token: string): UserPayload | null => {
  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) return null;
    return jwt.verify(token, refreshSecret) as UserPayload;
  } catch {
    return null;
  }
};

/**
 * Hashes a refresh token before saving in DB.
 */
export async function hashRefreshToken(token: string): Promise<string> {
  return argon2.hash(token);
}

/**
 * Verifies a refresh token against stored hash.
 */
export async function verifyRefreshTokenHash(
  token: string,
  hash: string
): Promise<boolean> {
  return argon2.verify(hash, token);
}
