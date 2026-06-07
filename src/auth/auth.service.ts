import { Injectable, HttpException, ConflictException } from '@nestjs/common';
import { CreateUser } from './dto/createUser.dto';
import { PrismaService } from 'src/lib/prisma.service';
import bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  private async hashPassword(password: string): Promise<string> {
    try {
      return bcrypt.hash(password, 10);
    } catch (err) {
      throw new HttpException('Password hash failed' + err.message, 500);
    }
  }
  private async comparePassword(plain: string, hash: string): Promise<boolean> {
    try {
      return bcrypt.compare(plain, hash);
    } catch (err) {
      throw new HttpException(
        'Password comparison failed' + err.message,
        err.status,
      );
    }
  }

  async createUser(userData: CreateUser) {
    const ifuserExit = await this.prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });
    if (ifuserExit) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await this.hashPassword(userData.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          passwordHash: hashedPassword,
          role: userData.role || 'attendee',
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      };
    } catch (err) {
      throw new HttpException('User creation failed' + err.message, 500);
    }
  }
}
