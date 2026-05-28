import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(tenantId: string) {
    const [
      activeCasesCount,
      pendingDeadlinesCount,
      totalDocumentsCount,
      totalClientsCount,
      recentActivity,
      workloadData,
      topLawyers,
    ] = await Promise.all([
      // 1. Active Cases Count
      this.prisma.case.count({
        where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),

      // 2. Pending Deadlines Count
      this.prisma.deadline.count({
        where: { tenantId, isDone: false, dueAt: { gte: new Date() } },
      }),

      // 3. Total Documents
      this.prisma.document.count({
        where: { tenantId },
      }),

      // 4. Total Clients
      this.prisma.client.count({
        where: { tenantId },
      }),

      // 5. Recent Activity (Audit Logs)
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),

      // 6. Workload Data (Cases per status)
      this.prisma.case.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),

      // 7. Top Lawyers (Most assigned cases)
      this.prisma.user.findMany({
        where: { tenantId, role: 'LAWYER' },
        select: {
          firstName: true,
          lastName: true,
          _count: { select: { cases: true } },
        },
        orderBy: { cases: { _count: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      counts: {
        activeCases: activeCasesCount,
        pendingDeadlines: pendingDeadlinesCount,
        totalDocuments: totalDocumentsCount,
        totalClients: totalClientsCount,
      },
      recentActivity,
      workload: workloadData,
      topLawyers,
    };
  }

  async getAiDashboardData(tenantId: string) {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      summariesGenerated,
      urgentCases,
      docsAnalyzed,
      casesWithSummary,
      casesByStatus,
      insights
    ] = await Promise.all([
      this.prisma.case.count({
        where: { tenantId, description: { not: null } }
      }),
      this.prisma.case.count({
        where: {
          tenantId,
          nextHearingDate: { gte: now, lte: in7Days }
        }
      }),
      this.prisma.document.count({
        where: { tenantId, status: 'INDEXED' }
      }),
      this.prisma.case.findMany({
        where: { tenantId, description: { not: null } },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          clientName: true,
          nextHearingDate: true,
          updatedAt: true,
          _count: { select: { documents: true } }
        }
      }),
      this.prisma.case.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true }
      }),
      this.prisma.case.findMany({
        where: {
          tenantId,
          nextHearingDate: { gte: now, lte: in7Days }
        },
        select: {
          id: true,
          title: true,
          nextHearingDate: true,
          _count: { select: { documents: true } }
        },
        take: 5
      })
    ]);

    const autoInsights = [];
    insights.forEach(c => {
      const daysLeft = Math.ceil((new Date(c.nextHearingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      autoInsights.push({
        type: 'warning',
        icon: 'alert-triangle',
        message: `Case ${c.title} : hearing in ${daysLeft} day(s), ${c._count.documents} document(s) linked`
      });
    });

    return {
      metrics: { summariesGenerated, urgentCases, docsAnalyzed },
      casesWithSummary,
      casesByStatus,
      insights: autoInsights
    };
  }
}
