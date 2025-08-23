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

const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = process.env;

/**
 * Generates an access and refresh token for a given user payload.
 */
export const generateTokens = (payload: UserPayload) => {
  if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT secret keys are not defined in environment variables.'
    );
  }

  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

/**
 * Verifies an access token and returns the decoded payload.
 */
export const verifyAccessToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET!) as UserPayload;
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
