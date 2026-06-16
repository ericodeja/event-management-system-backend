import {
  IsString,
  IsEnum,
  IsDataURI,
  IsUppercase,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from 'src/generated/prisma/enums';

export class PromoCodeDto {
  @IsString()
  @IsUppercase()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @Type(() => Number)
  @IsNotEmpty()
  discountValue: number;

  @Type(() => Number)
  @IsNotEmpty()
  usageLimit: number;

  @IsDateString()
  @IsNotEmpty()
  validFrom: Date;

  @IsDateString()
  @IsNotEmpty()
  validUntil: Date;
}
