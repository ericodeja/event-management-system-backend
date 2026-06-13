import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketType } from './create-ticketType.dto';

export class UpdateTicketType extends PartialType(CreateTicketType) {}
