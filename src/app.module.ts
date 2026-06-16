import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './lib/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OrganizerModule } from './organizer/organizer.module';
import { EventModule } from './event/event.module';
import { AdminModule } from './admin/admin.module';
import { OrderModule } from './order/order.module';
import { TicketModule } from './ticket/ticket.module';
import { CheckinModule } from './checkin/checkin.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule,
    OrganizerModule,
    EventModule,
    AdminModule,
    OrderModule,
    TicketModule,
    CheckinModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
