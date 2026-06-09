import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUser } from './dto/createUser.dto';
import { LoginUser } from './dto/loginUser.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(@Body() userData: CreateUser, @Res() res: Response) {
    const response = await this.authService.createUser(userData);
    return res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      user: response,
    });
  }

  @Post('/login')
  async login(@Body() userData: LoginUser, @Res() res: Response) {
    const result = await this.authService.loginUser(userData);

    return res.status(200).json({
      result,
    });
  }
}
