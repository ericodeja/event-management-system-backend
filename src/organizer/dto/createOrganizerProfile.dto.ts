import {
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  MinLength,
  IsObject,
  IsOptional,
} from 'class-validator';
export class CreateOrganizerProfile {
  @IsUUID()
  userId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  orgName: string;

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
