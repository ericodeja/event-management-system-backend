import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.service';
import { FilterUser } from './dto/filterUser.dto';
import { UserWhereInput } from '../generated/prisma/models';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUsers(filters: FilterUser) {
    try {
      const { search, role, page = 1, limit = 10 } = filters;

      const where: UserWhereInput = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(role && { role }),
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            organizerProfile: true,
          },
        }),

        this.prisma.user.count({ where }),
      ]);
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async approveOrganizer(organizerId: string) {
    try {
      await this.prisma.organizerProfile.update({
        where: { id: organizerId },
        data: {
          status: 'approved',
        },
      });

      this.logger.log(`Organizer profile approved: ID ${organizerId}`);
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async rejectOrganizer(organizerId: string, reason: string) {
    try {
      await this.prisma.organizerProfile.update({
        where: { id: organizerId },
        data: {
          status: 'rejected',
          rejectedReason: reason,
        },
      });

      this.logger.log(
        `Organizer profile rejected: ID ${organizerId}. Reason: ${reason}`,
      );
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async feature(eventId: string) {
    try {
      await this.prisma.event.update({
        where: { id: eventId },
        data: {
          isFeatured: true,
        },
      });

      this.logger.log(`Event featured: ID ${eventId}`);
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async suspendEvent(eventId: string) {
    try {
      await this.prisma.event.update({
        where: { id: eventId },
        data: {
          status: 'suspended',
        },
      });

      this.logger.log(`Event suspended: ID ${eventId}`);
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
