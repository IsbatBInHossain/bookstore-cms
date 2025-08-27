export interface UserResponsePayload {
  id: string;
  email: string;
  role: {
    name: string;
  };
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
}
