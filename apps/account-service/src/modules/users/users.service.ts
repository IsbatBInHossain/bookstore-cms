import type { PrismaClient } from '../../generated/prisma/index.js';
import type { UserEntity } from '../../shared/types/user.js';

export const updateMyProfile = async (
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
