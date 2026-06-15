import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
export class CreateTicketType {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsInt()
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @Type(() => Number)
  @IsInt()
  quantityAvailable: number;

  @IsDateString()
  saleStart: Date;

  @IsDateString()
  saleEnd: Date;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;
}
