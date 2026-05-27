import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(tenantId: string) {
    const [totalCases, activeCases, documentsCount, usersCount] = await Promise.all([
      this.prisma.case.count({ where: { tenantId } }),
      this.prisma.case.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.document.count({ where: { tenantId } }),
      this.prisma.user.count({ where: { tenantId } }),
    ]);

    // Analytics: Cases by Status
    const casesByStatus = await this.prisma.case.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    });

    return {
      totalCases,
      activeCases,
      documentsCount,
      usersCount,
      casesByStatus,
    };
  }
}
