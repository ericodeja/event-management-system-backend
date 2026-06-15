import { Controller, Body, Res, Post, Get } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { ValidateInput } from './dto/validateInput.dto';
import type { Response, Request } from 'express';

@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post('validate')
  async validate(@Body() validateInput: ValidateInput, @Res() res: Response) {
    const result = await this.checkinService.validate(validateInput);
    return res.status(200).json({
      result,
    });
  }
}
