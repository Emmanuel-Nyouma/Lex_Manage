import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { CasesModule } from './modules/cases/cases.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CaseDocumentsModule } from './modules/case-documents/case-documents.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiModule } from './modules/ai/ai.module';
import { AuditModule } from './modules/audit/audit.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ClientsModule } from './modules/clients/clients.module';
import { EventsModule } from './modules/events/events.module';
import { StatsModule } from './modules/stats/stats.module';
import { MailModule } from './modules/mail/mail.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { AppController } from './app.controller';
import { SecurityModule } from './modules/security/security.module';
import { createBullOptions, createCacheOptions, validateEnvironment } from './config/app.config';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },     // 10 reqs/sec
      { name: 'medium', ttl: 60000, limit: 60 },   // 60 reqs/min
      { name: 'long', ttl: 3600000, limit: 600 },  // 600 reqs/hour
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: createCacheOptions,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createBullOptions,
    }),
    PrismaModule,
    SecurityModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    CasesModule,
    DocumentsModule,
    CaseDocumentsModule,
    ChatModule,
    AiModule,
    AuditModule,
    SearchModule,
    NotificationsModule,
    ClientsModule,
    EventsModule,
    StatsModule,
    MailModule,
    CalendarModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
