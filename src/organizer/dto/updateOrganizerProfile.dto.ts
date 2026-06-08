import {
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  IsObject,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { OrganizerStatus } from '../../generated/prisma/enums';

export class UpdateOrganizerProfileDto {
  @IsUUID()
  userId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @IsOptional()
  orgName?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  @IsOptional()
  bio?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsUrl()
  @IsOptional()
  website?: string;

  @IsObject()
  @IsOptional()
  socialLinks?: {};
}
