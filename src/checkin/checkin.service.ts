import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ValidateInput } from './dto/validateInput.dto';
import { PrismaService } from 'src/lib/prisma.service';

@Injectable()
export class CheckinService {
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
        throw new BadRequestException('Invalid Ticket - Invalid ticketCode');
      }

      if (ticket.event.id !== validateInput.eventId) {
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
