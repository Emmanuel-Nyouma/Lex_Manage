import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: {
    tenantId: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    details?: any;
    ipAddress?: string;
  }) {
    // Persistent audit log
    return this.prisma.auditLog.create({ data: params }).catch((err) => {
      this.logger.error(`Failed to record audit log: ${err.message}`, err.stack);
    });
  }

  // Production Telemetry: Log system errors for monitoring
  logSystemError(error: Error, context?: any) {
    this.logger.error(`System Exception: ${error.message}`, {
      stack: error.stack,
      context,
    });
    // In a production environment, this would integrate with Sentry or Datadog
  }

  async getLogs(tenantId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
