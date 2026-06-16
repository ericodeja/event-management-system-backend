import {
  IsString,
  IsEnum,
  IsDataURI,
  IsUppercase,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from 'src/generated/prisma/enums';

export class PromoCodeDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

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

  @IsDataURI()
  @IsNotEmpty()
  validFrom: Date;

  @IsDataURI()
  @IsNotEmpty()
  validUntil: Date;
}
