import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import type { Response , Request} from 'express';

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
    const event = await this.eventService.create(req.user!.sub,createEventDto, coverImage);
    return res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  }
}
