import { Injectable, HttpException, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { PrismaService } from 'src/lib/prisma.service';
import slugigfy from 'slugify';
import { SupabaseService } from 'src/lib/supabase.service';
import { FilterEvent } from './dto/filter-event-dto';
import { Prisma } from 'src/generated/prisma/client';
import { start } from 'repl';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  private createSlug = (title: string) => {
    return slugigfy(title, {
      lower: true,
      strict: true,
    });
  };

  async create(
    userId: string,
    createEventDto: CreateEventDto,
    coverImage?: Express.Multer.File,
  ) {
    try {
      //get the organizerProfile
      const organizerId = await this.prisma.organizerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!organizerId) {
        throw new NotFoundException("User isn't an organizer");
      }
      const coverImageUrl = coverImage
        ? await this.supabaseService.uploadFile('covers', coverImage)
        : undefined;

      const event = await this.prisma.event.create({
        data: {
          slug: this.createSlug(createEventDto.title),
          organizerId: organizerId.id,
          coverImageUrl,
          ...createEventDto,
        },
      });

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        coverImageUrl: event.coverImageUrl,
        createdAt: event.createdAt,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(filters: FilterEvent) {
    try {
      const {
        search,
        category,
        city,
        country,
        venueType,
        startDate,
        endDate,
        isFeatured,
        page = 1,
        limit = 10,
      } = filters;

      const where: Prisma.EventWhereInput = {
        status: 'published',
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
          orderBy: { createdAt: 'desc' },
          include: {
            category: true,
            organizer: {
              select: { orgName: true, id: true },
            },
            ticketTypes: {
              select: { price: true },
              orderBy: { price: 'asc' },
              take: 1,
            },
          },
        }),
        this.prisma.event.count({ where }),
      ]);

      if (data.length < 1) {
        return "Event doesn't exist ";
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

  async findBySlug(eventSlug: string) {
    try {
      const event = await this.prisma.event.findFirst({
        where: { slug: { contains: eventSlug, mode: 'insensitive' } },
        include: {
          ticketTypes: true,
          category: { select: { name: true } },
          organizer: {
            select: {
              id: true,
              orgName: true,
              bio: true,
              website: true,
            },
          },
        },
      });
      if (!event) {
        throw new NotFoundException(
          `Event with slug - ${eventSlug} doesn't exist`,
        );
      }

      return event;
    } catch (err) {
      throw new HttpException(err.message, err.code || 500);
    }
  }

  async updateEvent(id: string, updateData: UpdateEventDto) {
    try {
      const event = await this.prisma.event.update({
        where: { id },
        data: updateData,
      });

      return event;
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async publishEvent(id: string) {
    try {
      const event = await this.prisma.event.update({
        where: { id },
        data: {
          status: 'published',
        },
        select: { id: true, status: true },
      });

      return event;
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }
  async cancelEvent(id: string, cancelReason: string) {
    try {
      await this.prisma.event.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelReason,
        },
        select: { id: true, status: true },
      });
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async deleteEvent(id: string) {
    try {
      await this.prisma.event.delete({
        where: { id },
      });
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
