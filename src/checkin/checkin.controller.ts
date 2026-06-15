import { Controller } from '@nestjs/common';
import { CheckinService } from './checkin.service';

@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}
}
