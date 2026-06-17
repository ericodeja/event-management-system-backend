import {
  Injectable,
  HttpException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { PrismaService } from '../lib/prisma.service';
import slugigfy from 'slugify';
import { SupabaseService } from '../lib/supabase.service';
import { FilterEvent } from './dto/filter-event-dto';
import { Prisma } from '../generated/prisma/client';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateTicketType } from './dto/create-ticketType.dto';
import { UpdateTicketType } from './dto/update-ticketType.dto';
import { PromoCodeDto } from './dto/promoCode.dto';
import { filter } from 'rxjs';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

      this.logger.log(
        `Event created: ${event.title} (ID: ${event.id}) by organizer ${organizerId}`,
      );

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        coverImageUrl: event.coverImageUrl,
        createdAt: event.createdAt,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(filters: FilterEvent) {
    try {
      const cacheKey = `events: ${JSON.stringify(filters)}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

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

      await this.cacheManager.set(cacheKey, data, 5 * 60 * 1000);

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
      this.logger.error(err.message, err.stack);
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

      const updated = await this.prisma.event.update({
        where: { id: eventId },
        data: updateData,
      });

      this.logger.log(
        `Event updated: ID ${eventId} by organizer ${organizerId}`,
      );

      await this.cacheManager.del(`events:slug:${updated.slug}`);
      await this.cacheManager.del('events:featured');

      return updated;
    } catch (err) {
      this.logger.error(err.message, err.stack);
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

      this.logger.log(
        `Event published: ID ${eventId} by organizer ${organizerId}`,
      );

      return event;
    } catch (err) {
      this.logger.error(err.message, err.stack);
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

      this.logger.log(
        `Event cancelled: ID ${eventId} by organizer ${organizerId}. Reason: ${cancelReason}`,
      );
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async deleteEvent(organizerId: string, eventId: string) {
    try {
      await this.isOrganizerEvent(organizerId, eventId);
      await this.prisma.event.delete({
        where: { id: eventId },
      });

      this.logger.log(
        `Event deleted: ID ${eventId} by organizer ${organizerId}`,
      );
    } catch (err) {
      this.logger.error(err.message, err.stack);
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
      this.logger.error(err.message, err.stack);
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
      this.logger.error(err.message, err.stack);
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
      this.logger.error(err.message, err.stack);
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
      this.logger.error(err.message, err.stack);
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

      this.logger.log(
        `Promo code created: ${promoCodeInput.code} (Value: ${promoCodeInput.discountValue} ${promoCodeInput.discountType}) for event ID: ${eventId}`,
      );

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
      this.logger.error(err.message, err.stack);
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
