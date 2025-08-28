import type { PrismaClient, RoleName } from '../generated/prisma/index.js';
import type { UserResponsePayload } from '../shared/types/user.js';
import { hashPassword } from '../shared/utils/password.js';

interface TestUserOptions {
  email: string;
  password: string;
  roleName?: RoleName;
  profile?: {
    firstName: string;
    lastName?: string;
    phone?: string;
  };
}

export const createTestUser = async (
  user: TestUserOptions,
  prisma: PrismaClient
): Promise<UserResponsePayload> => {
  const { email, password, roleName = 'CUSTOMER', profile } = user;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      id: existingUser.id,
      email: existingUser.email,
      role: { name: roleName },
      profile: null,
    };
  }

  const hash = await hashPassword(password);

  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(`Role ${roleName} not found. Please seed the database.`);
  }

  const newUser = await prisma.$transaction(async tx => {
    const createdUser = await tx.user.create({
      data: {
        email,
        passwordHash: hash,
        roleId: role.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (profile) {
      await tx.userProfile.create({
        data: {
          ...profile,
          userId: createdUser.id,
        },
      });
    }

    return createdUser;
  });

  return {
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
    profile: profile || null,
  };
};
