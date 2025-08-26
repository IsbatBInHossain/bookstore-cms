import { beforeEach } from 'vitest';
import { prisma } from './setup.js';

// This hook runs before each test case
beforeEach(async () => {
  // Reset all tables except Role or Permission, as they are static seeded data
  await prisma.$transaction([
    prisma.refreshToken.deleteMany(),
    prisma.userProfile.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});
