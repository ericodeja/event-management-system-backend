import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { TokenService } from 'src/lib/token.service';
import { PaystackService } from 'src/lib/paystack.service';
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
