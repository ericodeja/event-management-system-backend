import {
  HttpException,
  Injectable,
  RawBodyRequest,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY')!;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }
  async initializeTransaction(email: string, amount: number) {
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        { email, amount },
        { headers: this.headers },
      );
      return data;
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async paystackWebhook(req: RawBodyRequest<Request>) {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const hash = crypto
        .createHmac('sha512', this.config.get<string>('PAYSTACK_SECRET_KEY')!)
        .update(req.rawBody!)
        .digest('hex');

      if (hash !== signature) {
        throw new UnauthorizedException('Invalid webhook signature');
      }

      const event = req.body as any;

      switch (event.event) {
        case 'charge.success':
          await this.handlePaymentSuccess(event.data);
          break;
        case 'charge.failed':
          await this.handlePaymentFailure(event.data);
          break;

        default:
          break;
      }
      return { received: true };
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  private async handlePaymentSuccess(data: any) {}
  private async handlePaymentFailure(data: any) {}
}
