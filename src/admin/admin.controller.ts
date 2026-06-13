import { Controller, UseGuards, Get, Post, Body, Res } from '@nestjs/common';
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
}
