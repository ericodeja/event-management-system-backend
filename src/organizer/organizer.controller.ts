import { Controller, Post, Body } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerProfile } from './dto/createOrganizerProfile.dto';

@Controller('organizer')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post('/apply')
  apply(@Body() createOrganizerProfileDto: CreateOrganizerProfile) {
    return this.organizerService.apply(createOrganizerProfileDto);
  }
}
