import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
 type  LoggerService,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'object' && res !== null && 'message' in res
          ? (res as any).message
          : exception.message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const fields =
            (exception.meta?.target as string[])?.join(', ') ?? 'field';
          message = `A record with this ${fields} already exists`;
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          message = (exception.meta?.cause as string) ?? 'Record not found';
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          const field = exception.meta?.field_name ?? 'related record';
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
          message = `Database error [${exception.code}]`;
          break;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided to the database';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // log differently based on status code
    const logMessage = `${request.method} ${request.url} → ${status} ${message}`;
    const stack =
      exception instanceof Error ? exception.stack : String(exception);

    if (status >= 500) {
      this.logger.error(logMessage, stack, HttpExceptionFilter.name);
    } else if (status >= 400) {
      this.logger.warn(logMessage, HttpExceptionFilter.name);
    }

    return response.status(status).json({
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
