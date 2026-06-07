import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

export class UpdateUser {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
