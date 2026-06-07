import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUser } from 'src/user/dto/updateUser.dto';
import { PrismaService } from 'src/lib/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
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

  async updateMe(updateData: UpdateUser) {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: updateData.id,
        },
        data: updateData,
        select: {
          id: true,
          name: true,
          phone: true,
          avatarUrl: true,
          updatedAt: true,
        },
      });
      return user;
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }
}
