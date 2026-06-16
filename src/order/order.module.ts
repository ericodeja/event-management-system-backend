import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from '../lib/prisma.service';
import { TokenService } from '../lib/token.service';
import { PaystackService } from '../lib/paystack.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [OrderController],
  providers: [
    OrderService,
    PrismaService,
    TokenService,
    PaystackService,
    ConfigService,
  ],
})
export class OrderModule {}
