import {
  Strategy as JwtStrategy,
  ExtractJwt,
  type StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import { prisma } from './prisma-client.js';

// Options for the JWT Strategy
const options: StrategyOptionsWithoutRequest = {
  // Tells the strategy to extract the token from the Authorization header as a Bearer token
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_ACCESS_SECRET!,
};

// Core logic
const jwtStrategy = new JwtStrategy(options, async (jwt_payload: any, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: jwt_payload.id },
      include: { profile: true, role: true },
    });

    if (user) {
      // If the user is found, call the `done` callback with the user object.
      return done(null, user);
    } else {
      // If the user is not found, call `done` with `false`.
      return done(null, false);
    }
  } catch (error) {
    // If there's any other error, pass the error.
    return done(error, false);
  }
});

export default jwtStrategy;
