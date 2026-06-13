import { Role } from 'src/generated/prisma/enums';

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        role: Role;
        username: string;
        organizerId?: string;
      };
    }
  }
}

export {};
