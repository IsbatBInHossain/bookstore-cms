import {
  Strategy as JwtStrategy,
  ExtractJwt,
  type StrategyOptions,
} from 'passport-jwt';
import { PrismaClient } from '../generated/prisma/index.js';
import type { UserPayload } from '../shared/utils/tokens.util.js';
import type { Request } from 'express';
import type { UserResponsePayload } from '../shared/types/user.js';

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  passReqToCallback: true,
  secretOrKeyProvider: (request, rawJwtToken, done) => {
    done(null, process.env.JWT_ACCESS_SECRET);
  },
};

const jwtStrategy = new JwtStrategy(
  options,
  async (req: Request, payload: UserPayload, done) => {
    try {
      // Get the Prisma client from the app's context.
      const prisma: PrismaClient = req.app.locals.prisma;

      // Fetch the user from the database using the ID from the JWT payload.
      const user: UserResponsePayload | null = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          role: {
            select: {
              name: true,
              permissions: true,
            },
          },
          profile: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }
);

export default jwtStrategy;
