import { Controller, Post, Body, Patch } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerProfile } from './dto/createOrganizerProfile.dto';
import { UpdateOrganizerProfileDto } from './dto/updateOrganizerProfile.dto';

@Controller('organizer')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post('/apply')
  apply(@Body() createOrganizerProfileDto: CreateOrganizerProfile) {
    return this.organizerService.apply(createOrganizerProfileDto);
  }

  @Patch('update')
  async update(@Body() updateOrganizerProfileDto: UpdateOrganizerProfileDto) {
    return await this.organizerService.update(updateOrganizerProfileDto);
  }
}
