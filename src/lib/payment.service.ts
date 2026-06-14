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
}
