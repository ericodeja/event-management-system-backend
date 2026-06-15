import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { PrismaService } from 'src/lib/prisma.service';

@Module({
  controllers: [CheckinController],
  providers: [CheckinService, PrismaService],
})
export class CheckinModule {}
