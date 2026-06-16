import { Role } from '../../generated/prisma/enums';

export interface UserPayload {
  sub: string;
  email: string;
  role: Role;
  username: string;
}
