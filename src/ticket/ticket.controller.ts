import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { TicketService } from './ticket.service';
import type { Request, Response } from 'express';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get(':ticketCode')
  async findByCode(
    @Param('ticketCode') ticketCode: string,
    @Res() res: Response,
  ) {
    const ticket = await this.ticketService.findByCode(ticketCode);
    return res.status(200).json({
      ticket,
    });
  }
}
