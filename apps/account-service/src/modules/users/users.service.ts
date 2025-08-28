import { ApiError } from '../../core/api-error.js';
import type { PrismaClient, RoleName } from '../../generated/prisma/index.js';
import type { UserEntity } from '../../shared/types/user.js';
import type { Request } from 'express';

const updateMyProfile = async (
  userId: string,
  data: any,
  prisma: PrismaClient
): Promise<UserEntity> => {
  const { firstName, lastName, phone } = data;
  // Upsert user profile
  const updatedUser = await prisma.userProfile.upsert({
    where: { userId: userId },
    create: {
      firstName,
      lastName,
      phone,
      userId,
    },
    update: {
      firstName,
      lastName,
      phone,
    },
    // Select only necessary fields to return
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      user: {
        select: {
          id: true,
          email: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const updatedUserResponse = {
    id: updatedUser.user.id,
    email: updatedUser.user.email,
    role: updatedUser.user.role,
    profile: {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
    },
  };
  return updatedUserResponse;
};

const getAllUsers = async (prisma: PrismaClient): Promise<UserEntity[]> => {
  // Fetch all users with profilse and roles
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: {
        select: {
          name: true,
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

  return users;
};

const updateRole = async (
  req: Request,
  userId: string,
  roleName: RoleName
): Promise<UserEntity> => {
  const prisma = req.app.locals.prisma;
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!existingUser) {
    throw new ApiError(404, 'User with given id not found');
  }

  if (existingUser.id === req.user?.id) {
    throw new ApiError(403, 'Changing your own role is not allowed');
  }

  const role = await prisma.role.findUnique({
    where: {
      name: roleName,
    },
  });

  if (!role) {
    throw new ApiError(500, 'Database not seeded', false);
  }

  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      roleId: role.id,
    },
    select: {
      id: true,
      email: true,
      role: {
        select: {
          name: true,
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

  return user;
};

export const userService = {
  updateMyProfile,
  getAllUsers,
  updateRole,
};
