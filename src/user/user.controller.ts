import {
  Controller,
  Get,
  Res,
  Patch,
  Body,
  UseInterceptors,
  ParseUUIDPipe,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { UserService } from './user.service';
import type { Response } from 'express';
import { UpdateUser } from './dto/updateUser.dto';
import { UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  async findMe(
    @Res() res: Response,
    @Body('id', new ParseUUIDPipe()) id: string,
  ) {
    const response = await this.userService.findMe(id);
    return res.status(200).json({
      response,
    });
  }

  @Patch('/me')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateMe(
    @Res() res: Response,
    @Body() updateData: UpdateUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1 * 1024 * 1024,
            errorMessage: 'File size must be less than 1MB',
          }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
            errorMessage: 'File type must be JPEG or PNG',
          }),
        ],
        fileIsRequired: false,
      }),
    )
    avatar: Express.Multer.File,
  ) {
    const response = await this.userService.updateMe(updateData, avatar);
    return res.status(200).json({
      response,
    });
  }
}
