import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        const required = ['DATABASE_URL', 'JWT_SECRET', 'ALLOWED_ORIGINS'];
        const missing = required.filter((key) => !config[key]);
        if (missing.length > 0) {
          throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
        if (config['NODE_ENV'] === 'production') {
          const origins: string = config['ALLOWED_ORIGINS'] || '';
          if (origins.split(',').some((o: string) => o.trim().includes('localhost'))) {
            throw new Error('ALLOWED_ORIGINS must not contain localhost in production');
          }
          if (!config['REDIS_HOST'] || config['REDIS_HOST'] === 'localhost') {
            console.warn('[config] REDIS_HOST not set for production — defaulting to redis service');
          }
        }
        return config;
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },     // 10 reqs/sec
      { name: 'medium', ttl: 60000, limit: 60 },   // 60 reqs/min
      { name: 'long', ttl: 3600000, limit: 600 },  // 600 reqs/hour
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes default in ms (CacheManager v5+)
      max: 1000,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        // Managed Redis (Upstash, Render Key Value) needs auth + TLS.
        ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
        ...(process.env.REDIS_TLS === 'true' ? { tls: {} } : {}),
        // Required for serverless/hosted Redis to avoid premature command retries.
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      },
    }),
    PrismaModule,
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
