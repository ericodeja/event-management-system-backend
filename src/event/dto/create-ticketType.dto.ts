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

  @IsInt()
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

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
