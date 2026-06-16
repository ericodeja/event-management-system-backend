import {
  ExecutionContext,
  CanActivate,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';

export class OrganizerGuard implements CanActivate {
  private readonly logger = new Logger(OrganizerGuard.name)
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user!.organizerId) {
      this.logger.error('Organizer Authentication failed: Missing OrganizerId');
      throw new BadRequestException('Missing OrganizerId');
    }
    return true;
  }
}
