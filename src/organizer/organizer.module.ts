import { Module } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { OrganizerController } from './organizer.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { TokenService } from 'src/lib/token.service';

@Module({
  controllers: [OrganizerController],
  providers: [OrganizerService, PrismaService, TokenService],
})
export class OrganizerModule {}
