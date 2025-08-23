import { createLogger } from '@repo/logger';
import { PrismaClient } from '../src/generated/prisma/index.js';

const logger = createLogger({ service: 'account-service (prisma)' });
const prisma = new PrismaClient();

const main = async () => {
  await prisma.$connect();
  logger.info('Seeding started....');

  // Seed roles
  const roles = [
    { name: 'CUSTOMER', description: 'Default role for new users.' },
    {
      name: 'MANAGER',
      description: 'Can manage store-specific data like books and orders.',
    },
    { name: 'ADMIN', description: 'Has full access to the system.' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name }, // Check if a role with this name exists
      update: {}, // If it exists, do nothing
      create: {
        name: role.name,
        description: role.description,
      },
    });
    logger.info(`Upserted role: ${role.name}`);
  }

  logger.info('Database seeding complete');
};

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
