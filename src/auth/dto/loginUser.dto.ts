import { IsEmail, IsString, Length } from 'class-validator';

export class LoginUser {
    @IsEmail()
    @Length(5, 100)
    email: string

    @IsString()
    @Length(8, 100)
    password: string
}