import { IsEmail, IsInt, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentInput {
  @IsString()
  @IsEmail()
  email: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  amount: number;
}
