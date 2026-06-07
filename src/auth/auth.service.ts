import { Injectable } from '@nestjs/common';
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
      throw new Error('Error hashing password:' + err);
    }
  }
  private async comparePassword(plain: string, hash: string): Promise<boolean> {
    try {
      return bcrypt.compare(plain, hash);
    } catch (err) {
      throw new Error('Error comparing password:' + err);
    }
  }

  async createUser(userData: CreateUser) {
    try {
      const hashedPassword = await this.hashPassword(userData.password);
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
      throw new Error(err);
    }
  }
}
