import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../generated/prisma/enums';

export class CreateUser {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
