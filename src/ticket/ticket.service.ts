import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma.service';

@Injectable()
export class TicketService {
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
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
