import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      // NestJS HTTP exceptions (including validation errors from ValidationPipe)
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'object' && res !== null && 'message' in res
          ? (res as any).message
          : exception.message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Known Prisma errors (e.g. constraint violations)
      const prismaError = exception as Prisma.PrismaClientKnownRequestError;
      switch (prismaError.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const fields =
            (prismaError.meta?.target as string[])?.join(', ') ?? 'field';
          message = `A record with this ${fields} already exists`;
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          message = (prismaError.meta?.cause as string) ?? 'Record not found';
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          const field = prismaError.meta?.field_name ?? 'related record';
          message = `Invalid reference: ${field} does not exist`;
          break;
        }
        case 'P2014': {
          status = HttpStatus.BAD_REQUEST;
          message = 'This change would violate a required relationship';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          message = `Database error [${prismaError.code}]: ${prismaError.message.split('\n').pop()?.trim() ?? prismaError.code}`;
          break;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      // Prisma validation errors (e.g. missing required fields, wrong types)
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided to the database';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} → ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
