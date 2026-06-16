import { Injectable, LoggerService } from '@nestjs/common';
import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// Development formatting: colored, readable text
const devConsoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, context, stack, ...meta } = info;
    const contextStr = context ? ` \x1b[33m[${context}]\x1b[39m` : '';
    const stackStr = stack ? `\n\x1b[31m${stack}\x1b[39m` : '';
    
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      // Filter out system level metadata if any
      metaStr = ` - ${JSON.stringify(meta)}`;
    }
    
    return `[Nest] - ${timestamp} ${level}:${contextStr} ${message}${metaStr}${stackStr}`;
  }),
);

// Production formatting: structured JSON
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? prodFormat : devConsoleFormat,
    handleExceptions: true,
    handleRejections: true,
  }),
  new winston.transports.File({
    filename: 'logs/app.log',
    level: logLevel,
    format: prodFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: prodFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }),
];

export const winstonLoggerInstance = winston.createLogger({
  level: logLevel,
  format: prodFormat,
  transports: transports,
  exitOnError: false,
});

@Injectable()
export class WinstonLogger implements LoggerService {
  private logger = winstonLoggerInstance;

  private getContextAndMeta(optionalParams: any[]) {
    let context = 'App';
    let meta: any = {};

    if (optionalParams.length > 0) {
      const lastParam = optionalParams[optionalParams.length - 1];
      if (typeof lastParam === 'string') {
        context = lastParam;
        if (optionalParams.length > 1) {
          meta = optionalParams.slice(0, -1);
        }
      } else {
        meta = optionalParams;
      }
    }
    return { context, meta };
  }

  log(message: any, ...optionalParams: any[]) {
    const { context, meta } = this.getContextAndMeta(optionalParams);
    this.logger.info(message, { context, ...meta });
  }

  error(message: any, ...optionalParams: any[]) {
    let context = 'App';
    let stack: string | undefined = undefined;
    let meta: any = {};

    if (message instanceof Error) {
      stack = message.stack;
      message = message.message;
    }

    if (optionalParams.length > 0) {
      const lastParam = optionalParams[optionalParams.length - 1];
      if (typeof lastParam === 'string') {
        context = lastParam;
        if (optionalParams.length > 1) {
          const possibleStack = optionalParams[0];
          if (typeof possibleStack === 'string') {
            stack = possibleStack;
            if (optionalParams.length > 2) {
              meta = optionalParams.slice(1, -1);
            }
          } else {
            meta = optionalParams.slice(0, -1);
          }
        }
      } else {
        meta = optionalParams;
      }
    }

    this.logger.error(message, { context, stack, ...meta });
  }

  warn(message: any, ...optionalParams: any[]) {
    const { context, meta } = this.getContextAndMeta(optionalParams);
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: any, ...optionalParams: any[]) {
    const { context, meta } = this.getContextAndMeta(optionalParams);
    this.logger.debug(message, { context, ...meta });
  }

  verbose(message: any, ...optionalParams: any[]) {
    const { context, meta } = this.getContextAndMeta(optionalParams);
    this.logger.verbose(message, { context, ...meta });
  }

  fatal(message: any, ...optionalParams: any[]) {
    const { context, meta } = this.getContextAndMeta(optionalParams);
    this.logger.error(message, { context, fatal: true, ...meta });
  }
}
