import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUser } from './dto/createUser.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(@Body() userData: CreateUser, @Res() res: Response) {
    try {
      const response = await this.authService.createUser(userData);
      return res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        user: response,
      });
    } catch (err) {
      return res.status(500).json({
        message: err instanceof Error ? err.message : 'Registration failed',
      });
    }
  }
}
