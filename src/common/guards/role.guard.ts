import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserPayload } from 'src/auth/types/payload.type';
import type { Request } from 'express';
import { PrismaService } from 'src/lib/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // if no roles are set on the route, allow access
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user: UserPayload = request.user!;

    if (!requiredRoles.includes(user?.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    // Assign organizerId to 'organizer' 
    if (requiredRoles.includes('organizer')) {
      const organizer = await this.prisma.organizerProfile.findUnique({
        where: { userId: request.user!.sub },
        select: { id: true },
      });
      request.user!.organizerId = organizer!.id;
    }

    return true;
  }
}
