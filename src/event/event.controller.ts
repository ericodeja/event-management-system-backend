import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  Query,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseInterceptors,
  UseGuards,
  Param,
  NotFoundException,
  Patch,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { FilterEvent } from './dto/filter-event-dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateTicketType } from './dto/create-ticketType.dto';
import { Roles } from 'src/common/decorators/roles.decorators';
import { RolesGuard } from 'src/common/guards/role.guard';
import { OrganizerGuard } from 'src/common/guards/organizer.guard';
import { UpdateTicketType } from './dto/update-ticketType.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('organizer')
@UseGuards(OrganizerGuard)
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseInterceptors(FileInterceptor('coverImage'))
  async create(
    @Res() res: Response,
    @Req() req: Request,
    @Body() createEventDto: CreateEventDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 2 * 1024 * 1024,
            errorMessage: 'File size must be less than 2MB',
          }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
            errorMessage: 'Invalid file type',
          }),
        ],
        fileIsRequired: false,
      }),
    )
    coverImage: Express.Multer.File,
  ) {
    const organizerId = req.user?.organizerId;
    if (!organizerId) {
      throw new NotFoundException('OrganizerId Missing');
    }
    const event = await this.eventService.create(
      req.user!.organizerId!,
      createEventDto,
      coverImage,
    );
    return res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  }

  @Get()
  async findAll(@Query() filters: FilterEvent) {
    return await this.eventService.findAll(filters);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') eventSlug: string, @Res() res: Response) {
    const event = await this.eventService.findBySlug(eventSlug);
    return res.status(200).json({
      event,
    });
  }

  @Patch(':eventId')
  async updateEvent(
    @Param('eventId') eventId: string,
    @Req() req: Request,
    @Body() updateData: UpdateEventDto,
    @Res() res: Response,
  ) {
    const event = await this.eventService.updateEvent(
      req.user!.organizerId!,
      eventId,
      updateData,
    );
    return res.status(200).json({
      event,
    });
  }

  @Patch(':eventId/publish')
  async publishEvent(
    @Param('eventId') eventId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const event = await this.eventService.publishEvent(
      req.user!.organizerId!,
      eventId,
    );
    return res.status(200).json({
      message: 'Event published successfully',
      event,
    });
  }

  @Get(':eventId/cancel')
  async cancelEvent(
    @Param('eventId') eventId: string,
    @Req() req: Request,
    @Body() reason: string,
    @Res() res: Response,
  ) {
    await this.eventService.cancelEvent(
      req.user!.organizerId!,
      eventId,
      reason,
    );
    return res.status(200).json({
      message: 'Event cancelled all attendees will be notified',
    });
  }

  @Get(':eventId')
  async deleteEvent(
    @Param('eventId') eventId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.eventService.deleteEvent(req.user!.organizerId!, eventId);
    return res.status(200).json({
      message: 'Event successfully deleted',
    });
  }

  //Ticket types

  @Post(':eventId/ticket-types')
  async createTicketType(
    @Param('eventId') eventId: string,
    @Body() createTicketInput: CreateTicketType,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const ticketType = await this.eventService.createTicketType(
      req.user!.organizerId!,
      eventId,
      createTicketInput,
    );

    return res.status(201).json({
      message: 'TicketType successfully created',
      ticketType,
    });
  }

  @Get(':eventId/ticket-types')
  async getTicketType(@Param('eventId') eventId: string, @Res() res: Response) {
    const data = await this.eventService.getTicketType(eventId);
    return res.status(200).json({
      data,
    });
  }

  @Patch(':eventId/ticket-types/:ticketId')
  async updateTicketType(
    @Param() params: string[],
    @Req() req: Request,
    @Res() res: Response,
    @Body() updateTicketTypeInput: UpdateTicketType,
  ) {
    await this.eventService.updateTicketType(
      req.user!.organizerId!,
      params[0],
      params[1],
      updateTicketTypeInput,
    );

    res.status(200).json({
      message: 'Ticket type updated successfully',
    });
  }

  @Delete(':eventId/ticket-types/:ticketId')
  async deleteTicketType(
    @Param() params: string[],
    @Req() req: Request,
    @Res() res: Response,
  ) {
      await this.eventService.deleteTicketType(
        req.user!.organizerId!,
        params[0],
        params[1],
      );

      res.status(200).json({
        message: 'Ticket type updated successfully',
      });
  }
}
