import {
  ExecutionContext,
  CanActivate,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';

export class OrganizerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user!.organizerId) {
      throw new BadRequestException('Missing OrganizerId');
    }
    return true;
  }
}
