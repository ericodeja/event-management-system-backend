import { HttpException, Injectable } from '@nestjs/common';
import { CreateOrganizerProfile } from './dto/createOrganizerProfile.dto';
import { PrismaService } from 'src/lib/prisma.service';

@Injectable()
export class OrganizerService {
  constructor(private readonly prisma: PrismaService) {}
  async apply(createOrganizerProfileDto: CreateOrganizerProfile) {
    try {
      console.log(createOrganizerProfileDto.socialLinks);
      const organizer = await this.prisma.organizerProfile.create({
        data: createOrganizerProfileDto,
        omit: { rejectedReason: true },
      });
      return organizer;
    } catch (err) {
      throw new HttpException(err.message, 500);
    }
  }
}
