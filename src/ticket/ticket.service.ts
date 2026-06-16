import {
  HttpException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma.service';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(ticketCode: string) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { ticketCode },
        include: {
          event: {
            select: {
              title: true,
              startTime: true,
              venueAddress: true,
              venueType: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException(
          `Ticket with code ${ticketCode} doesn't exist`,
        );
      }

      return ticket;
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
