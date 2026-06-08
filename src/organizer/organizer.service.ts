import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrganizerProfile } from './dto/createOrganizerProfile.dto';
import { PrismaService } from 'src/lib/prisma.service';
import { UpdateOrganizerProfileDto } from './dto/updateOrganizerProfile.dto';

@Injectable()
export class OrganizerService {
  constructor(private readonly prisma: PrismaService) {}
  async apply(createOrganizerProfileDto: CreateOrganizerProfile) {
    try {
      const organizer = await this.prisma.organizerProfile.create({
        data: createOrganizerProfileDto,
        omit: { rejectedReason: true, userId: true, id: true },
      });
      return organizer;
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async update(updateOrganizerProfileDto: UpdateOrganizerProfileDto) {
    try {
      const currentOrganizer = await this.prisma.organizerProfile.findUnique({
        where: { userId: updateOrganizerProfileDto.userId },
      });
      if (!currentOrganizer) {
        throw new NotFoundException('Organizer profile not found');
      }
      const organizer = await this.prisma.organizerProfile.update({
        where: { userId: updateOrganizerProfileDto.userId },
        data: updateOrganizerProfileDto,
        omit: {
          updatedAt: true,
          userId: true,
          id: true,
          status: true,
          rejectedReason: true,
        },
      });

      return organizer;
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
