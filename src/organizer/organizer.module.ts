import { Module } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { OrganizerController } from './organizer.controller';
import { PrismaService } from '../lib/prisma.service';
import { TokenService } from '../lib/token.service';

@Module({
  controllers: [OrganizerController],
  providers: [OrganizerService, PrismaService, TokenService],
})
export class OrganizerModule {}
