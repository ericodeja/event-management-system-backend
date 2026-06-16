import {
  Controller,
  Body,
  Res,
  Post,
  Req,
  Get,
  UseGuards,
} from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { ValidateInput } from './dto/validateInput.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorators';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post('validate')
  async validate(
    @Body() validateInput: ValidateInput,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const result = await this.checkinService.validate(
      req.user?.sub!,
      validateInput,
    );
    return res.status(200).json({
      result,
    });
  }
}
