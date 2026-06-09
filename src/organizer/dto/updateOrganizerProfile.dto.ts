import {
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  IsObject,
  IsOptional,
} from 'class-validator';

export class UpdateOrganizerProfileDto {
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
