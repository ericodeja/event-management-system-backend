import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../lib/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../lib/token.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, TokenService],
})
export class AuthModule {}
