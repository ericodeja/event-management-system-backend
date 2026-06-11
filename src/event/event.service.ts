import { Injectable, HttpException, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { PrismaService } from 'src/lib/prisma.service';
import slugigfy from 'slugify';
import { SupabaseService } from 'src/lib/supabase.service';

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
}
