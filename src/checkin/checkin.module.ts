import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { PrismaService } from '../lib/prisma.service';
import { TokenService } from '../lib/token.service';

@Module({
  controllers: [CheckinController],
  providers: [CheckinService, PrismaService, TokenService],
})
export class CheckinModule {}
