import { Role } from 'src/generated/prisma/enums';

export interface UserPayload {
  sub: string;
  email: string;
  role: Role;
  username: string;
}
