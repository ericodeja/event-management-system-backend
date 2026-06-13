import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/generated/prisma/enums';
import { PrismaService } from './prisma.service';
import { UserPayload } from 'src/auth/types/payload.type';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getAccessToken(userId: string, role: Role, username: string) {
    const payload = { sub: userId, username, role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: '15m',
    });

    return accessToken;
  }

  async getRefreshToken(userId: string, role: Role, username: string) {
    const payload: UserPayload = { sub: userId, username, role };

    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: '7d',
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    return refreshToken;
  }

  async verifyToken(token: string, type: string) {
    try {
      const payload = this.jwtService.verify<UserPayload>(token, {
        secret: this.configService.get(`${type}_TOKEN_SECRET`),
      });

      return payload;
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
