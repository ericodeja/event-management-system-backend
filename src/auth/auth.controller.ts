import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUser } from './dto/createUser.dto';
import { LoginUser } from './dto/loginUser.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(@Body() userData: CreateUser) {
    const response = await this.authService.createUser(userData);
    return {
      message: 'Registration successful. Please verify your email.',
      user: response,
    };
  }

  @Post('/login')
  async login(@Body() userData: LoginUser) {
    const result = await this.authService.loginUser(userData);
    return { result };
  }

  @Post('/refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refresh(refreshTokenDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  async logout(@Req() req: Request) {
    await this.authService.logOut(req.user!.sub);
  }
}
