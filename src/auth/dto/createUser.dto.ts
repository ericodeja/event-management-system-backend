import { Role } from "../../generated/prisma/enums";

export class CreateUser {
  name: string
  email: string
  password: string
  role?: Role
}