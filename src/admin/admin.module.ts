import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../lib/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../lib/token.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PrismaService, ConfigService, TokenService],
})
export class AdminModule {}
