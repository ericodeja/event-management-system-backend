import { Controller, Get, Req, Res, Patch, Body } from '@nestjs/common';
import { UserService } from './user.service';
import type { Response } from 'express';
import { UpdateUser } from './dto/updateUser.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  async findMe(@Res() res: Response, @Body() req: { id: string }) {
    const response = await this.userService.findMe(req.id);
    return res.status(200).json({
      response,
    });
  }

  @Patch('/me')
  async updateMe(@Res() res: Response, @Body() updateData: UpdateUser) {
    const response = await this.userService.updateMe(updateData);
    return res.status(200).json({
      response,
    });
  }
}
