import jwt from 'jsonwebtoken';
import {
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} from '../constants/index.js';

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
 * Verifies a refresh token and returns the decoded payload.
 */
export const verifyRefreshToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET!) as UserPayload;
  } catch {
    return null;
  }
};
