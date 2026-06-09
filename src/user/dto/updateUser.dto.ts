import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

export class UpdateUser {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
