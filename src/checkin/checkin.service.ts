import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ValidateInput } from './dto/validateInput.dto';
import { PrismaService } from '../lib/prisma.service';

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validate(userId: string, validateInput: ValidateInput) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { ticketCode: validateInput.ticketCode },
        include: {
          event: { select: { id: true } },
          ticketType: { select: { name: true } },
          orderItem: { select: { userId: true } },
        },
      });

      if (!ticket) {
        this.logger.warn(`Failed check-in: ticket code ${validateInput.ticketCode} not found (User: ${userId})`);
        throw new BadRequestException('Invalid Ticket - Invalid ticketCode');
      }

      if (ticket.event.id !== validateInput.eventId) {
        this.logger.warn(`Failed check-in: ticket ${validateInput.ticketCode} does not belong to event ${validateInput.eventId} `);
        throw new BadRequestException(
          "This ticket doesn't belong to this event",
        );
      }
      if (
        ticket.status === 'used' ||
        ticket.status === 'cancelled' ||
        ticket.checkedInAt ||
        ticket.checkedInById
      ) {
        this.logger.warn(`Failed check-in: ticket ${validateInput.ticketCode} is already used or cancelled (Status: ${ticket.status}) `);
        throw new BadRequestException(
          'Invalid Ticket - This ticket has been used or cancelled ',
        );
      }

      const checkedInAt = new Date();

      setImmediate(async () => {
        await this.prisma.ticket.update({
          where: { ticketCode: ticket.ticketCode },
          data: {
            checkedInAt,
            checkedInById: userId,
            status: 'used',
          },
        });
      });
      this.logger.log(`Ticket ${ticket.ticketCode} checked in successfully for event ID: ${validateInput.eventId} by user ID: ${userId}`);

      return {
        valid: true,
        message: 'Check-in successful',
        ticket: {
          ticketCode: ticket.ticketCode,
          attendeeName: ticket.attendeeName,
          ticketType: ticket.ticketType.name,
          checkedInAt,
        },
      };
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
