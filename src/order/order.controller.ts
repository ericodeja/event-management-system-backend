import {
  Controller,
  Post,
  UseGuards,
  Body,
  Res,
  Req,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { OrderItemInput } from './dto/orderItemInput.dto';
import type { Request, Response } from 'express';
import { OrderInput } from './dto/orderInput.dto';
import { PaymentStatus } from '../generated/prisma/enums';
import type { RawBodyRequest } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorators';

@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('addToCart')
  async createOrderItem(
    @Body() itemInput: OrderItemInput,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.orderService.createOrderItem(req.user?.sub!, itemInput);
    return res.status(200).json({
      message: 'Item successfully added to cart',
    });
  }

  @Post('checkout')
  async create(
    @Body() orderInput: OrderInput,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.orderService.createOrder(
      req.user?.sub!,
      req.user?.email!,
      orderInput,
    );

    return res.status(201).json({ result });
  }

  @Get(':orderId')
  async findById(
    @Param('orderId') orderId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const order = await this.orderService.findById(orderId);
    return res.status(200).json({ order });
  }

  @Get('/me')
  async findUserOrder(
    @Req() req: Request,
    @Res() res: Response,
    @Query() paymentStatus?: PaymentStatus,
  ) {
    const order = await this.orderService.findUserOrder(
      req.user?.sub!,
      paymentStatus,
    );
    return res.status(200).json({ order });
  }

  @Public()
  @Post('/webhook/paystack')
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    await this.orderService.handleWebhook(req);
  }
}
