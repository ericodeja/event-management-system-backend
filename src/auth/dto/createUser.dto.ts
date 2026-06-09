import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  Length
} from 'class-validator';

export class CreateUser {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @Length(5, 100)
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
}
