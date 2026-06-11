import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { SupabaseService } from 'src/lib/supabase.service';
import { ConfigService } from '@nestjs/config';
import { TokenService } from 'src/lib/token.service';

@Module({
  controllers: [EventController],
  providers: [EventService, PrismaService, SupabaseService, ConfigService, TokenService],
})
export class EventModule {}
