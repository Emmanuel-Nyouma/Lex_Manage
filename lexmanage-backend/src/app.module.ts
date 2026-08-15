import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import KeyvRedis from '@keyv/redis';

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
          const productionRequired = [
            'REDIS_HOST',
            'S3_ENDPOINT',
            'S3_ACCESS_KEY',
            'S3_SECRET_KEY',
            'S3_BUCKET',
            'FRONTEND_URL',
          ];
          const productionMissing = productionRequired.filter((key) => !config[key]);
          if (productionMissing.length > 0) {
            throw new Error(
              `Missing production environment variables: ${productionMissing.join(', ')}`,
            );
          }
          const origins: string = config['ALLOWED_ORIGINS'] || '';
          if (origins.split(',').some((o: string) => o.trim().includes('localhost'))) {
            throw new Error('ALLOWED_ORIGINS must not contain localhost in production');
          }
          if (config['REDIS_HOST'] === 'localhost') {
            throw new Error('REDIS_HOST must not be localhost in production');
          }
          if (!['AES256', 'aws:kms'].includes(config['S3_SERVER_SIDE_ENCRYPTION'])) {
            throw new Error('S3_SERVER_SIDE_ENCRYPTION must be AES256 or aws:kms in production');
          }
          if (
            config['S3_SERVER_SIDE_ENCRYPTION'] === 'aws:kms' &&
            !config['S3_KMS_KEY_ID']
          ) {
            throw new Error('S3_KMS_KEY_ID is required when using aws:kms encryption');
          }
        }
        if (String(config['JWT_SECRET']).length < 32) {
          throw new Error('JWT_SECRET must contain at least 32 characters');
        }
        if (
          config['NODE_ENV'] === 'production' &&
          /change[_-]?me|replace[_-]?me/i.test(String(config['JWT_SECRET']))
        ) {
          throw new Error('JWT_SECRET still contains a placeholder value');
        }
        if (config['N8N_WEBHOOK_SECRET'] && String(config['N8N_WEBHOOK_SECRET']).length < 32) {
          throw new Error('N8N_WEBHOOK_SECRET must contain at least 32 characters');
        }
        if (config['NODE_ENV'] === 'production' && !config['DATA_ENCRYPTION_KEY']) {
          throw new Error('DATA_ENCRYPTION_KEY is required in production');
        }
        const retentionDays = Number(config['AUDIT_RETENTION_DAYS'] || 730);
        if (!Number.isInteger(retentionDays) || retentionDays < 90 || retentionDays > 3650) {
          throw new Error('AUDIT_RETENTION_DAYS must be an integer between 90 and 3650');
        }
        const malwareMode = String(
          config['MALWARE_SCAN_MODE'] ||
            (config['NODE_ENV'] === 'production' ? 'required' : 'disabled'),
        ).toLowerCase();
        if (!['required', 'optional', 'disabled'].includes(malwareMode)) {
          throw new Error('MALWARE_SCAN_MODE must be required, optional or disabled');
        }
        if (config['NODE_ENV'] === 'production' && malwareMode !== 'required') {
          throw new Error('MALWARE_SCAN_MODE must be required in production');
        }
        if (malwareMode === 'required' && !config['CLAMAV_HOST']) {
          throw new Error('CLAMAV_HOST is required when malware scanning is required');
        }
        if (
          config['NODE_ENV'] === 'production' &&
          config['PUBLIC_API_URL'] &&
          !String(config['PUBLIC_API_URL']).startsWith('https://')
        ) {
          throw new Error('PUBLIC_API_URL must use HTTPS in production');
        }
        if (
          (config['N8N_RAG_CHAT_URL'] ||
            config['N8N_RAG_INGEST_URL'] ||
            config['N8N_RAG_DELETE_URL']) &&
          !config['N8N_WEBHOOK_SECRET']
        ) {
          throw new Error('N8N_WEBHOOK_SECRET is required when n8n integration is enabled');
        }
        return config;
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },     // 10 reqs/sec
      { name: 'medium', ttl: 60000, limit: 60 },   // 60 reqs/min
      { name: 'long', ttl: 3600000, limit: 600 },  // 600 reqs/hour
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const protocol = config.get('REDIS_TLS') === 'true' ? 'rediss' : 'redis';
        const redisPassword = config.get<string>('REDIS_PASSWORD');
        const password = redisPassword
          ? `:${encodeURIComponent(redisPassword)}@`
          : '';
        const url =
          config.get<string>('REDIS_URL') ||
          `${protocol}://${password}${config.get('REDIS_HOST') || 'localhost'}:${config.get('REDIS_PORT') || '6379'}`;
        return {
          stores: [new KeyvRedis(url)],
          ttl: 300000,
        };
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST') || 'localhost',
          port: Number(config.get('REDIS_PORT') || 6379),
          ...(config.get('REDIS_PASSWORD') ? { password: config.get('REDIS_PASSWORD') } : {}),
          ...(config.get('REDIS_TLS') === 'true' ? { tls: {} } : {}),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
      }),
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
