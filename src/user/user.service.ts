import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUser } from 'src/user/dto/updateUser.dto';
import { PrismaService } from 'src/lib/prisma.service';
import { SupabaseService } from 'src/lib/supabase.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async findMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      omit: {
        passwordHash: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateMe(updateData: UpdateUser, avatar?: Express.Multer.File) {
    try {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: updateData.id },
        select: { avatarUrl: true },
      });
      const avatarUrl = avatar
        ? await this.supabaseService.uploadFile('avatars', avatar)
        : undefined;

      const user = await this.prisma.user.update({
        where: {
          id: updateData.id,
        },
        data: {
          ...updateData,
          avatarUrl,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          avatarUrl: true,
          updatedAt: true,
        },
      });

      if (avatar && currentUser?.avatarUrl) {
        setImmediate(() => {
          this.supabaseService
            .deleteFile(currentUser.avatarUrl!)
            .catch((err) =>
              console.error('Background avatar delete failed: ' + err.message),
            );
        });
      }
      return user;
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }
}
