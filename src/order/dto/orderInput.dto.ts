import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class OrderInput {
  @IsString()
  @IsOptional()
  promoCodeId?: string;

  @IsString()
  @IsOptional()
  currency? = 'NGN';

  @Type(() => Array)
  @IsArray()
  orderItemIds: [];
}
