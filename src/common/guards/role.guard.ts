import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserPayload } from '../../auth/types/payload.type';
import type { Request } from 'express';
import { PrismaService } from '../../lib/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
      this.logger.error(
        `User Authorization failed: ${user.sub} can't access this resource`,
      );
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    // Assign organizerId to 'organizer'
    if (requiredRoles.includes('organizer')) {
      const cacheKey = `organizerProfile: ${user!.sub}`;
      const cached: { id: string } | undefined =
        await this.cacheManager.get(cacheKey);
      if (cached) {
        request.user!.organizerId = cached.id;
        return true;
      }

      const organizer = await this.prisma.organizerProfile.findUnique({
        where: { userId: request.user!.sub },
        select: { id: true },
      });
      request.user!.organizerId = organizer!.id;
      await this.cacheManager.set(
        cacheKey,
        { id: organizer!.id },
        5 * 60 * 1000,
      );
    }

    return true;
  }
}
