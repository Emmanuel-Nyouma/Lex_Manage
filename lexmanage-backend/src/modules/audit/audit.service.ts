import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DataProtectionService } from '../security/data-protection.service';
import { tenantContext } from '../../common/context/tenant.context';

@Injectable()
export class AuditService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private prisma: PrismaService,
    private protection: DataProtectionService,
  ) {}
  private cleanupTimer?: NodeJS.Timeout;
  private initialCleanupTimer?: NodeJS.Timeout;

  onModuleInit() {
    this.initialCleanupTimer = setTimeout(() => {
      void this.cleanupExpiredLogs();
    }, 30_000);
    this.initialCleanupTimer.unref();
    this.cleanupTimer = setInterval(() => {
      void this.cleanupExpiredLogs();
    }, 24 * 60 * 60 * 1000);
    this.cleanupTimer.unref();
  }

  onModuleDestroy() {
    if (this.initialCleanupTimer) clearTimeout(this.initialCleanupTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  async log(params: {
    tenantId: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    details?: any;
    ipAddress?: string;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          ...params,
          details: params.details === undefined ? undefined : this.protection.encryptJson(params.details),
        },
      });
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to record audit log: ${error.message}`, error.stack);
      throw err;
    }
  }

  // Production Telemetry: Log system errors for monitoring
  logSystemError(error: Error, context?: any) {
    this.logger.error(`System Exception: ${error.message}`, {
      stack: error.stack,
      context,
    });
    // In a production environment, this would integrate with Sentry or Datadog
  }

  async getLogs(tenantId: string, limit = 50, cursor?: string) {
    const safeLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, limit)) : 50;
    const rows = await this.prisma.auditLog.findMany({
      where: { tenantId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: safeLimit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > safeLimit;
    const data = this.protection.deepDecrypt(hasMore ? rows.slice(0, safeLimit) : rows);
    return {
      data,
      meta: {
        limit: safeLimit,
        hasMore,
        nextCursor: hasMore ? data[data.length - 1].id : null,
      },
    };
  }

  async cleanupExpiredLogs() {
    const retentionDays = Number(process.env.AUDIT_RETENTION_DAYS || 730);
    const cutoff = new Date(Date.now() - retentionDays * 86_400_000);
    try {
      const result = await tenantContext.runUnscoped(() =>
        this.prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      );
      if (result.count > 0) {
        this.logger.log(`Deleted ${result.count} audit logs older than ${retentionDays} days`);
      }
      return result.count;
    } catch (error) {
      this.logger.error('Audit retention cleanup failed', error as Error);
      return 0;
    }
  }
}
