import {
  Injectable,
  HttpException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateUser } from './dto/createUser.dto';
import { LoginUser } from './dto/loginUser.dto';
import { PrismaService } from '../lib/prisma.service';

import bcrypt from 'bcrypt';
import { TokenService } from '../lib/token.service';
import { RefreshTokenDto } from './dto/refreshToken.dto';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async createUser(userData: CreateUser) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: userData.email,
      },
      select: { email: true },
    });
    if (user) {
      this.logger.warn(
        `Registration attempt with existing email: ${user.email}`,
      );
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await this.hashPassword(userData.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          passwordHash: hashedPassword,
        },
      });

      this.logger.log(
        `User created successfully: ${user.email} (ID: ${user.id})`,
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      };
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException('User creation failed' + err.message, 500);
    }
  }

  async loginUser(loginData: LoginUser) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginData.email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          name: true,
        },
      });

      if (!user) {
        this.logger.warn(
          `Login failed: User with email ${loginData.email} not found`,
        );
        throw new NotFoundException("User doesn't exist");
      }

      const isVerified = await this.comparePassword(
        loginData.password,
        user.passwordHash,
      );

      if (!isVerified) {
        this.logger.warn(
          `Login failed: Invalid credentials for user ${loginData.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = await this.tokenService.getAccessToken(
        user.id,
        user.email,
        user.role,
        user.name,
      );
      const refreshToken = await this.tokenService.getRefreshToken(
        user.id,
        user.email,
        user.role,
        user.name,
      );

      this.logger.log(`User logged in successfully: (ID: ${user.id})`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async logOut(userId: string) {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
      this.logger.log(`User logged out successfully (ID: ${userId})`);
      return result;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = await this.tokenService.verifyToken(
        refreshTokenDto.token,
        'REFRESH',
      );

      if (!payload) {
        throw new BadRequestException('Invalid or expired token');
      }

      const oldToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshTokenDto.token },
      });

      if (!oldToken) {
        throw new BadRequestException('Invalid or expired token');
      }

      if (new Date() > oldToken.expiresAt) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const newAccessToken = await this.tokenService.getAccessToken(
        payload.sub,
        payload.email,
        payload.role,
        payload.username,
      );
      const newRefreshToken = await this.tokenService.getRefreshToken(
        payload.sub,
        payload.email,
        payload.role,
        payload.username,
      );

      this.logger.log(
        `Token refreshed successfully for user ID: ${payload.sub}`,
      );

      return { newAccessToken, newRefreshToken };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, 10);
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException('Password hash failed' + err.message, 500);
    }
  }
  private async comparePassword(plain: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plain, hash);
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException(
        'Password comparison failed' + err.message,
        err.status,
      );
    }
  }
}
