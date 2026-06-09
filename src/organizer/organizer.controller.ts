import { Controller, Post, Body, Patch, Req} from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerProfile } from './dto/createOrganizerProfile.dto';
import { UpdateOrganizerProfileDto } from './dto/updateOrganizerProfile.dto';
import type { Request } from 'express';

@Controller('organizer')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post('/apply')
  apply(@Body() createOrganizerProfileDto: CreateOrganizerProfile, @Req() req: Request) {
    return this.organizerService.apply(req.user!.sub, createOrganizerProfileDto);
  }

  @Patch('update')
  async update(@Body() updateOrganizerProfileDto: UpdateOrganizerProfileDto, @Req() req: Request) {
    return await this.organizerService.update(req.user!.sub, updateOrganizerProfileDto);
  }
}
