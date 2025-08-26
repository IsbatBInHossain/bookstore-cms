import { PrismaClient } from '../../generated/prisma/index.js';
import { createLogger } from '@repo/logger';

const logger = createLogger({ service: 'account-service (prisma)' });

/*
 * Seed the database with initial data.
 * This function can be called in different contexts, such as during application startup or via CLI.
 */
export const seedDatabase = async (prisma: PrismaClient) => {
  logger.info('Seeding database with provided Prisma client...');

  const roles = [
    { name: 'CUSTOMER', description: 'Default role for new users.' },
    { name: 'MANAGER', description: 'Can manage store-specific data...' },
    { name: 'ADMIN', description: 'Has full access...' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name, description: role.description },
    });
    logger.info(`Upserted role: ${role.name}`);
    const checkRoles = await prisma.role.findMany();
    for (let r of checkRoles) {
      console.log(JSON.stringify(r));
    }
  }

  logger.info('Database seeding complete.');
};

// This main function allows us to still run `pnpm prisma db seed` manually.
async function main() {
  const prisma = new PrismaClient();
  try {
    await seedDatabase(prisma);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// If this script is run directly, execute the main function.
if (process.env.NODE_ENV !== 'test') {
  // A guard to prevent running in test
  main();
}
