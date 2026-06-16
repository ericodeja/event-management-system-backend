import {
  Injectable,
  HttpException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { PrismaService } from 'src/lib/prisma.service';
import slugigfy from 'slugify';
import { SupabaseService } from 'src/lib/supabase.service';
import { FilterEvent } from './dto/filter-event-dto';
import { Prisma } from 'src/generated/prisma/client';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateTicketType } from './dto/create-ticketType.dto';
import { UpdateTicketType } from './dto/update-ticketType.dto';
import { PromoCodeDto } from './dto/promoCode.dto';

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

  private isOrganizerEvent = async (organizerId: string, eventId: string) => {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!eventId) {
      throw new NotFoundException('Event not found');
    }
    if (event?.organizerId !== organizerId) {
      throw new UnauthorizedException(
        'You are not allowed to access this resource',
      );
    }

    return;
  };

  async create(
    organizerId: string,
    createEventDto: CreateEventDto,
    coverImage?: Express.Multer.File,
  ) {
    try {
      const coverImageUrl = coverImage
        ? await this.supabaseService.uploadFile('covers', coverImage)
        : undefined;

      const event = await this.prisma.event.create({
        data: {
          slug: this.createSlug(createEventDto.title),
          organizerId,
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
            ticketTypes: true,
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

  async updateEvent(
    organizerId: string,
    eventId: string,
    updateData: UpdateEventDto,
  ) {
    try {
      await this.isOrganizerEvent(organizerId, eventId);

      const event = await this.prisma.event.update({
        where: { id: eventId },
        data: updateData,
      });

      return event;
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async publishEvent(organizerId: string, eventId: string) {
    try {
      await this.isOrganizerEvent(organizerId, eventId);

      const event = await this.prisma.event.update({
        where: { id: eventId },
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
  async cancelEvent(
    organizerId: string,
    eventId: string,
    cancelReason: string,
  ) {
    try {
      await this.isOrganizerEvent(organizerId, eventId);
      await this.prisma.event.update({
        where: { id: eventId },
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

  async deleteEvent(organizerId: string, eventId: string) {
    try {
      await this.isOrganizerEvent(organizerId, eventId);
      await this.prisma.event.delete({
        where: { id: eventId },
      });
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async createTicketType(
    organizerId: string,
    eventId: string,
    createEventInput: CreateTicketType,
  ) {
    try {
      await this.isOrganizerEvent(organizerId, eventId);
      const ticketType = await this.prisma.ticketType.create({
        data: { eventId, ...createEventInput },
        omit: { createdAt: true, updatedAt: true, quantitySold: true },
      });

      return ticketType;
    } catch (err) {
      throw new HttpException(err.message, err.code || 500);
    }
  }

  async getTicketType(eventId: string) {
    try {
      const result = await this.prisma.ticketType.findMany({
        where: { eventId },
      });

      if (result.length < 1) {
        return 'This event has no saved TicketTypes';
      }

      return result;
    } catch (err) {
      throw new HttpException(err.message, err.code || 500);
    }
  }

  async updateTicketType(
    organizerId: string,
    eventId: string,
    ticketId: string,
    updateTicketTypeInput: UpdateTicketType,
  ) {
    try {
      await this.isOrganizerEvent(organizerId, eventId);
      const ticketType = await this.prisma.ticketType.findUnique({
        where: { id: ticketId },
      });

      if (!ticketType) {
        throw new NotFoundException('Ticket type not found');
      }

      if (ticketType.eventId !== eventId) {
        throw new ForbiddenException(
          'Ticket type does not belong to this event',
        );
      }

      await this.prisma.ticketType.update({
        where: { id: ticketId },
        data: updateTicketTypeInput,
      });
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async deleteTicketType(
    organizerId: string,
    eventId: string,
    ticketId: string,
  ) {
    try {
      await this.isOrganizerEvent(organizerId, eventId);

      const ticketType = await this.prisma.ticketType.findUnique({
        where: { id: ticketId },
      });

      if (!ticketType) {
        throw new NotFoundException('Ticket type not found');
      }

      if (ticketType.eventId !== eventId) {
        throw new ForbiddenException(
          'Ticket type does not belong to this event',
        );
      }

      await this.prisma.ticketType.delete({
        where: { id: ticketId },
      });
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async createPromoCode(eventId: string, promoCodeInput: PromoCodeDto) {
    try {
      const promoCode = await this.prisma.promoCode.create({
        data: {
          eventId,
          ...promoCodeInput,
        },
      });

      return {
        message: 'Promo code created successfully.',
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          usageLimit: promoCode.usageLimit,
          timesUsed: 0,
        },
      };
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
