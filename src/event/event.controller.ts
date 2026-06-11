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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { FilterEvent } from './dto/filter-event-dto';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @UseGuards(JwtAuthGuard)
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
    const event = await this.eventService.create(
      req.user!.sub,
      createEventDto,
      coverImage,
    );
    return res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() filters: FilterEvent) {
    return await this.eventService.findAll(filters);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':slug')
  async findBySlug(@Param('slug') eventSlug: string, @Res() res: Response) {
    const event = await this.eventService.findBySlug(eventSlug);
    return res.status(200).json({
      event,
    });
  }
}
