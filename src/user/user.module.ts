import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { SupabaseService } from 'src/lib/supabase.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, SupabaseService],
})
export class UserModule {}
