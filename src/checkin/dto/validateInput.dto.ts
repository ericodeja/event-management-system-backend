import { IsString } from 'class-validator';

export class ValidateInput {
  @IsString()
  ticketCode: string;

  @IsString()
  eventId: string;
}
