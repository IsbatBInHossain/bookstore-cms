import type { RolePermission } from '../../generated/prisma/index.js';

export interface UserResponsePayload {
  id: string;
  email: string;
  role: {
    name: string;
    permissions?: RolePermission[];
  };
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
}
