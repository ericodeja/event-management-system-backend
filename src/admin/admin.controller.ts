import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Res,
  Param,
  Patch,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { FilterUser } from './dto/filterUser.dto';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(@Body() filters: FilterUser, @Res() res: Response) {
    const result = await this.adminService.getUsers(filters);
    return res.status(200).json({
      result,
    });
  }

  @Patch('organizers/:organizerId/approve')
  async approveOrganizer(
    @Param('organizerId') organizerId: string,
    @Res() res: Response,
  ) {
    await this.adminService.approveOrganizer(organizerId);
    return res.status(200).json({
      message: 'Organizer approved. User has been notified',
    });
  }

  @Patch('organizers/:organizerId/reject')
  async rejectOrganizer(
    @Param('organizerId') organizerId: string,
    @Body() reason: string,
    @Res() res: Response,
  ) {
    await this.adminService.rejectOrganizer(organizerId, reason);
    return res.status(200).json({
      message: 'Organizer application rejected. User has been notified.',
    });
  }

  @Patch('events/:eventId/feature')
  async featured(@Param('eventId') eventId: string, @Res() res: Response) {
    await this.adminService.feature(eventId);
    return res.status(200).json({
      message: 'Event marked as featured',
    });
  }
}
