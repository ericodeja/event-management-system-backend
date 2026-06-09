import {
  Injectable,
  HttpException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUser } from './dto/createUser.dto';
import { LoginUser } from './dto/loginUser.dto';
import { PrismaService } from 'src/lib/prisma.service';

import bcrypt from 'bcrypt';
import { TokenService } from 'src/lib/token.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}
  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, 10);
    } catch (err) {
      throw new HttpException('Password hash failed' + err.message, 500);
    }
  }
  private async comparePassword(plain: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plain, hash);
    } catch (err) {
      throw new HttpException(
        'Password comparison failed' + err.message,
        err.status,
      );
    }
  }

  async createUser(userData: CreateUser) {
    const ifuserExit = await this.prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });
    if (ifuserExit) {
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

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      };
    } catch (err) {
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
        throw new NotFoundException("User doesn't exist");
      }

      const isVerified = await this.comparePassword(
        loginData.password,
        user.passwordHash,
      );

      if (!isVerified) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const { accessToken, refreshToken } =
        await this.tokenService.generateAuthTokens(
          user.id,
          user.role,
          user.name,
        );

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
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
