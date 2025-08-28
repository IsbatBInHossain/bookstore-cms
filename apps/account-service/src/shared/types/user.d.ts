import { UserEntity } from './user.d';
export interface UserEntity {
  id: string;
  email: string;
  role: {
    name: string;
    permissions?: {
      permission: {
        action: string;
        subject: string;
      };
    }[];
  };
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
}

export type UserEntityWithPermission = Omit<UserEntity, 'role'> & {
  role: {
    name: string;
    permissions: { permission: { action: string; subject: string } }[];
  };
};

export {};
