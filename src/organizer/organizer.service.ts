import { HttpException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateOrganizerProfile } from './dto/createOrganizerProfile.dto';
import { PrismaService } from 'src/lib/prisma.service';
import { UpdateOrganizerProfileDto } from './dto/updateOrganizerProfile.dto';
import { FilterOrganizerEvent } from './dto/filter-organizerEvents.dto';
import { EventWhereInput } from 'src/generated/prisma/models';

@Injectable()
export class OrganizerService {
  private readonly logger = new Logger(OrganizerService.name);

  constructor(private readonly prisma: PrismaService) {}
  async apply(
    userId: string,
    createOrganizerProfileDto: CreateOrganizerProfile,
  ) {
    try {
      const organizer = await this.prisma.organizerProfile.create({
        data: {
          userId,
          ...createOrganizerProfileDto,
        },
        omit: { rejectedReason: true, userId: true, id: true },
      });

      this.logger.log(`Organizer profile applied: ${createOrganizerProfileDto.orgName} for user: ${userId}`);

      return organizer;
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async update(
    userId: string,
    updateOrganizerProfileDto: UpdateOrganizerProfileDto,
  ) {
    try {
      const currentOrganizer = await this.prisma.organizerProfile.findUnique({
        where: { userId },
      });
      if (!currentOrganizer) {
        throw new NotFoundException('Organizer profile not found');
      }
      const organizer = await this.prisma.organizerProfile.update({
        where: { userId },
        data: updateOrganizerProfileDto,
        omit: {
          updatedAt: true,
          userId: true,
          id: true,
          status: true,
          rejectedReason: true,
        },
      });

      this.logger.log(`Organizer profile updated: ${updateOrganizerProfileDto.orgName || 'N/A'} for user: ${userId}`);

      return organizer;
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async getOrganizerEvents(organizerId: string, filters: FilterOrganizerEvent) {
    try {
      const {
        search,
        city,
        country,
        venueType,
        isFeatured,
        category,
        startDate,
        endDate,
        status,
        page = 1,
        limit = 10,
      } = filters;
      const where: EventWhereInput = {
        organizerId,
        ...(status && { status }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(country && { country }),
        ...(venueType && { venueType }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(category && { category: { slug: category } }),
        ...(startDate && { startTime: { gte: new Date(startDate) } }),
        ...(endDate && { startTime: { lte: new Date(endDate) } }),
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.event.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            category: true,
          },
        }),
        this.prisma.event.count({ where }),
      ]);

      if (data.length < 1) {
        return 'You have no events';
      }
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
      throw new HttpException(err.message, err.code || 500);
    }
  }
}
