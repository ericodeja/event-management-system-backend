import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { EventStatus, VenueType } from 'src/generated/prisma/enums';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  organizerId: string;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(VenueType)
  @IsNotEmpty()
  venueType: VenueType;

  @IsString()
  @IsOptional()
  venueAddress?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  virtualLink?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsInt()
  @IsOptional()
  capacity?: number;
}
