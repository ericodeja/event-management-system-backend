import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentInput } from './dto/paymentInput.dto';
import type { Response } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/initialize')
  async initializeTransaction(
    @Body() paymentInput: PaymentInput,
    @Res() res: Response,
  ) {
    const data = await this.paymentService.initializeTransaction(
      paymentInput.email,
      paymentInput.amount,
    );
    return res.status(201).json({
      data,
    });
  }

  @Post('webhook/paystack')
  async paystackWebhook(@Req() req: RawBodyRequest<Request>) {
    await this.paymentService.paystackWebhook(req);
  }
}
