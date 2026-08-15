import {
  Controller,
  Get,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from './prisma/prisma.service';
import { MinioService } from './modules/documents/minio.service';

@Controller()
export class AppController implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MinioService,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
      ...(process.env.REDIS_PASSWORD
        ? { password: process.env.REDIS_PASSWORD }
        : {}),
      ...(process.env.REDIS_TLS === 'true' ? { tls: {} } : {}),
      lazyConnect: true,
      connectTimeout: 3000,
      commandTimeout: 3000,
      maxRetriesPerRequest: 1,
    });
    this.redis.on('error', () => undefined);
  }

  @Get('health')
  health() {
    return this.ready();
  }

  @Get('health/live')
  live() {
    return { status: 'ok' };
  }

  @Get('health/ready')
  async ready() {
    const checks = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.pingRedis(),
      this.storage.checkHealth(),
    ]);
    const names = ['database', 'redis', 'storage'];
    const dependencies = Object.fromEntries(
      checks.map((check, index) => [
        names[index],
        check.status === 'fulfilled' ? 'ok' : 'unavailable',
      ]),
    );
    if (checks.some((check) => check.status === 'rejected')) {
      throw new ServiceUnavailableException({
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'Une dépendance requise est indisponible.',
        fields: dependencies,
      });
    }
    return { status: 'ok', dependencies };
  }

  async onModuleDestroy() {
    if (this.redis.status !== 'end') {
      await this.redis.quit().catch(() => this.redis.disconnect());
    }
  }

  private async pingRedis() {
    if (this.redis.status === 'wait') {
      await this.redis.connect();
    }
    return this.redis.ping();
  }
}
