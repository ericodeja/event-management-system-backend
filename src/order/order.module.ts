import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { TokenService } from 'src/lib/token.service';
import { PaymentService } from 'src/lib/payment.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, PrismaService, TokenService, PaymentService],
})
export class OrderModule {}
