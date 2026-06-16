import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../lib/prisma.service';
import { SupabaseService } from '../lib/supabase.service';
import { TokenService } from '../lib/token.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, SupabaseService, TokenService],
})
export class UserModule {}
