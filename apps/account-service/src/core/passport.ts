import {
  Strategy as JwtStrategy,
  ExtractJwt,
  type StrategyOptions,
} from 'passport-jwt';
import { PrismaClient } from '../generated/prisma/index.js';
import type { UserPayload } from '../shared/utils/tokens.util.js';
import type { Request } from 'express';

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  // This tells Passport to pass the entire `req` object to our callback.
  passReqToCallback: true,
  // We still need a secretOrKeyProvider, but we can simplify it.
  secretOrKeyProvider: (request, rawJwtToken, done) => {
    done(null, process.env.JWT_ACCESS_SECRET);
  },
};

// The function signature now changes to include `req` as the first argument.
const jwtStrategy = new JwtStrategy(
  options,
  async (req: Request, payload: UserPayload, done) => {
    try {
      // Get the CORRECT Prisma client from the app's context.
      const prisma: PrismaClient = req.app.locals.prisma;

      // Now, we query the correct database (the test DB during tests).
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        omit: { roleId: true, passwordHash: true },
        include: { profile: true, role: true },
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
