import {
  Controller,
  Get,
  Res,
  Req,
  Patch,
  Body,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards
} from '@nestjs/common';
import { UserService } from './user.service';
import type { Response, Request } from 'express';
import { UpdateUser } from './dto/updateUser.dto';
import { UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async findMe(
    @Res() res: Response,
    @Req() req: Request
  ) {
    const response = await this.userService.findMe(req.user!.sub);
    return res.status(200).json({
      response,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/me')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateMe(
    @Res() res: Response,
    @Req() req: Request,
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
    const response = await this.userService.updateMe(req.user!.sub, updateData, avatar);
    return res.status(200).json({
      response,
    });
  }
}
