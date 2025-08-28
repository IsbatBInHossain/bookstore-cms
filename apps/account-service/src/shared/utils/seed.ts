import {
  PermissionAction,
  PermissionSubject,
  PrismaClient,
  RoleName,
} from '../../generated/prisma/index.js';
import { createLogger } from '@repo/logger';

const logger = createLogger({ service: 'account-service (prisma)' });

// Helper function to seed roles
const seedRoles = async (prisma: PrismaClient) => {
  const roles = [
    { name: RoleName.CUSTOMER, description: 'Default role for new users.' },
    {
      name: RoleName.MANAGER,
      description: 'Can manage store-specific data...',
    },
    { name: RoleName.ADMIN, description: 'Has full access...' },
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
};

// Helper function to seed permissions
const seedPermissions = async (prisma: PrismaClient) => {
  const actions = [
    PermissionAction.CREATE,
    PermissionAction.READ,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
  ];
  const subjects = [
    PermissionSubject.USER,
    PermissionSubject.BOOK,
    PermissionSubject.ORDER,
  ];
  const permissions = [];
  for (const action of actions) {
    for (const subject of subjects) {
      permissions.push({
        action,
        subject,
        description: `Allows ${action.toLowerCase()} on ${subject.toLowerCase()}`,
      });
    }
  }

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        action_subject: {
          action: permission.action,
          subject: permission.subject,
        },
      },
      update: {},
      create: {
        action: permission.action,
        subject: permission.subject,
        description: permission.description,
      },
    });
    logger.info(
      `Upserted permission: ${permission.action} on ${permission.subject}`
    );
  }
};

/*
 * Seed the database with initial data.
 * This function can be called in different contexts, such as during application startup or via CLI.
 */
export const seedDatabase = async (prisma: PrismaClient) => {
  logger.info('Seeding database with provided Prisma client...');
  await seedRoles(prisma);
  await seedPermissions(prisma);

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
