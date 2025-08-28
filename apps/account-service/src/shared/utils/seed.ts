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
  }
  const checkRoles = await prisma.role.findMany();
  if (checkRoles.length !== roles.length) {
    throw new Error('Role seeding failed. Please check the logs.');
  }
  logger.info(
    `Role seeding complete. Roles: ${checkRoles.map(r => r.name).join(', ')}`
  );
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
  }
  const checkPermissions = await prisma.permission.findMany();
  if (checkPermissions.length !== permissions.length) {
    throw new Error('Permission seeding failed. Please check the logs.');
  }
  logger.info(
    `Permission seeding complete. Permissions: ${checkPermissions
      .map(p => `${p.action.toLowerCase()}:${p.subject.toLowerCase()}`)
      .join(', ')}`
  );
};

// Helper function to assign permissions to roles
const seedRolePermissions = async (prisma: PrismaClient) => {
  const rolePermissions: Record<
    RoleName,
    { action: PermissionAction; subject: PermissionSubject }[]
  > = {
    [RoleName.ADMIN]: [
      // Admin gets all permissions
      { action: PermissionAction.CREATE, subject: PermissionSubject.USER },
      { action: PermissionAction.READ, subject: PermissionSubject.USER },
      { action: PermissionAction.UPDATE, subject: PermissionSubject.USER },
      { action: PermissionAction.DELETE, subject: PermissionSubject.USER },
      { action: PermissionAction.CREATE, subject: PermissionSubject.BOOK },
      { action: PermissionAction.READ, subject: PermissionSubject.BOOK },
      { action: PermissionAction.UPDATE, subject: PermissionSubject.BOOK },
      { action: PermissionAction.DELETE, subject: PermissionSubject.BOOK },
      { action: PermissionAction.CREATE, subject: PermissionSubject.ORDER },
      { action: PermissionAction.READ, subject: PermissionSubject.ORDER },
      { action: PermissionAction.UPDATE, subject: PermissionSubject.ORDER },
      { action: PermissionAction.DELETE, subject: PermissionSubject.ORDER },
    ],
    [RoleName.MANAGER]: [
      // Manager can manage books and orders, and read users
      { action: PermissionAction.READ, subject: PermissionSubject.USER },
      { action: PermissionAction.CREATE, subject: PermissionSubject.BOOK },
      { action: PermissionAction.READ, subject: PermissionSubject.BOOK },
      { action: PermissionAction.UPDATE, subject: PermissionSubject.BOOK },
      { action: PermissionAction.DELETE, subject: PermissionSubject.BOOK },
      { action: PermissionAction.READ, subject: PermissionSubject.ORDER },
      { action: PermissionAction.UPDATE, subject: PermissionSubject.ORDER },
    ],
    [RoleName.CUSTOMER]: [
      // Customer can read books and manage their own orders
      { action: PermissionAction.READ, subject: PermissionSubject.BOOK },
      { action: PermissionAction.CREATE, subject: PermissionSubject.ORDER },
      { action: PermissionAction.READ, subject: PermissionSubject.ORDER },
      { action: PermissionAction.UPDATE, subject: PermissionSubject.ORDER },
    ],
  };

  logger.info('Assigning permissions to roles...');
  for (const roleName in rolePermissions) {
    const role = await prisma.role.findUnique({
      where: { name: roleName as RoleName },
    });
    if (!role) continue;

    const permissionsToAssign = rolePermissions[roleName as RoleName];
    for (const p of permissionsToAssign) {
      const permission = await prisma.permission.findUnique({
        where: { action_subject: { action: p.action, subject: p.subject } },
      });
      if (!permission) continue;

      // Upsert to avoid creating duplicate entries
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
  }
  logger.info('Role-permission assignment complete.');
};

/*
 * Seed the database with initial data.
 * This function can be called in different contexts, such as during application startup or via CLI.
 */
export const seedDatabase = async (prisma: PrismaClient) => {
  logger.info('Seeding database with provided Prisma client...');
  await seedRoles(prisma);
  await seedPermissions(prisma);
  await seedRolePermissions(prisma);

  logger.info('Database seeding complete.');
};

// This main function allows to still run `pnpm prisma db seed` manually.
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
