import {
  Controller,
  Post,
  Body,
  Patch,
  Req,
  UseGuards,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerProfile } from './dto/createOrganizerProfile.dto';
import { UpdateOrganizerProfileDto } from './dto/updateOrganizerProfile.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { RolesGuard } from 'src/common/guards/role.guard';
import { FilterOrganizerEvent } from './dto/filter-organizerEvents.dto';
import { OrganizerGuard } from 'src/common/guards/organizer.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizer')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Roles('attendee')
  @Post('/apply')
  apply(
    @Body() createOrganizerProfileDto: CreateOrganizerProfile,
    @Req() req: Request,
  ) {
    return this.organizerService.apply(
      req.user!.sub,
      createOrganizerProfileDto,
    );
  }

  @Roles('organizer')
  @UseGuards(OrganizerGuard)
  @Patch('update')
  async update(
    @Body() updateOrganizerProfileDto: UpdateOrganizerProfileDto,
    @Req() req: Request,
  ) {
    return await this.organizerService.update(
      req.user!.sub,
      updateOrganizerProfileDto,
    );
  }

  @Roles('organizer')
  @UseGuards(OrganizerGuard)
  @Get('events')
  async getOrganizerEvents(
    @Query() filters: FilterOrganizerEvent,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.organizerService.getOrganizerEvents(
      req.user!.organizerId!,
      filters,
    );

    return res.status(200).json({
      result,
    });
  }
}
