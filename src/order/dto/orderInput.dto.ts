import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class OrderInput {


  @IsString()
  @IsOptional()
  promoCodeId?: string;

  @IsString()
  @IsOptional()
  currency? = 'NGN';

  @IsArray()
  orderItemIds: []
}
