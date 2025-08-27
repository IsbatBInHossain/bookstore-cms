declare global {
  namespace Express {
    export interface User {
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

    export interface Request {
      user?: User;
    }
  }
}

export {};
