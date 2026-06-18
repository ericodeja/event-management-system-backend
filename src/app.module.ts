import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './lib/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OrganizerModule } from './organizer/organizer.module';
import { EventModule } from './event/event.module';
import { AdminModule } from './admin/admin.module';
import { OrderModule } from './order/order.module';
import { TicketModule } from './ticket/ticket.module';
import { CheckinModule } from './checkin/checkin.module';
import { WinstonModule } from 'nest-winston';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import * as winston from 'winston';
import 'dotenv/config';
import {BullModule} from '@nestjs/bullmq'
import { EmailModule } from './email/email.module';

const isDev = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: isDev
            ? winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'HH:mm:ss' }),
                winston.format.printf(
                  ({ level, message, timestamp, context, stack }) => {
                    return `[${timestamp}] ${level} ${context ? '[' + context + ']' : ''}: ${message}${stack ? '\n' + stack : ''}`;
                  },
                ),
              )
            : winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
        }),

        // write errors to a file in production
        ...(!isDev
          ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                ),
              }),
              new winston.transports.File({
                filename: 'logs/app.log',
                level: 'info',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                ),
              }),
            ]
          : []),
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (config: ConfigService) => ({
        store: redisStore,
        url: config.get<string>('REDIS_URL'),
        ttl: 60 * 1000,
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule,
    OrganizerModule,
    EventModule,
    AdminModule,
    OrderModule,
    TicketModule,
    CheckinModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
