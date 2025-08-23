import jwt from 'jsonwebtoken';
import { ApiError } from '../../core/api-error.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h';

if (!JWT_SECRET) {
  throw new ApiError(500, 'Internal Server Error', false);
}

export function createJWT(payload: object) {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string) {
  return jwt.verify(token, JWT_SECRET as string) as any;
}
