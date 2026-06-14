import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class OrderItemInput {
  @IsString()
  ticketTypeId: string;

  @Type(() => Number)
  @IsInt()
  quantity: number;
}
