import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(tenantId: string) {
    const now   = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      activeCasesCount,
      activeCasesPrev,
      pendingDeadlinesCount,
      pendingDeadlinesPrev,
      totalDocumentsCount,
      totalDocumentsPrev,
      totalClientsCount,
      totalClientsPrev,
      recentActivity,
      workloadData,
      topLawyers,
      upcomingDeadlines,
      weeklyCases,
      weeklyDeadlines,
    ] = await Promise.all([
      this.prisma.case.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.case.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] }, createdAt: { lt: month } } }),
      this.prisma.deadline.count({ where: { tenantId, isDone: false, dueAt: { gte: now } } }),
      this.prisma.deadline.count({ where: { tenantId, isDone: false, dueAt: { gte: now }, createdAt: { lt: month } } }),
      this.prisma.document.count({ where: { tenantId } }),
      this.prisma.document.count({ where: { tenantId, createdAt: { lt: month } } }),
      this.prisma.client.count({ where: { tenantId } }),
      this.prisma.client.count({ where: { tenantId, createdAt: { lt: month } } }),

      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),

      this.prisma.case.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),

      this.prisma.user.findMany({
        where: { tenantId, isActive: true },
        select: {
          firstName: true,
          lastName: true,
          _count: { select: { cases: true } },
        },
        orderBy: { cases: { _count: 'desc' } },
        take: 5,
      }),

      this.prisma.deadline.findMany({
        where: { tenantId, isDone: false, dueAt: { gte: now } },
        orderBy: { dueAt: 'asc' },
        take: 5,
        include: { case: { select: { title: true } } },
      }),

      // Cases created per week for last 8 weeks
      this.prisma.$queryRaw<{ week: Date; count: bigint }[]>`
        SELECT date_trunc('week', "created_at") AS week, COUNT(*) AS count
        FROM cases
        WHERE "tenant_id" = ${tenantId}
          AND "created_at" >= NOW() - INTERVAL '8 weeks'
        GROUP BY week
        ORDER BY week ASC
      `,

      // Deadlines per week for last 8 weeks
      this.prisma.$queryRaw<{ week: Date; count: bigint }[]>`
        SELECT date_trunc('week', "created_at") AS week, COUNT(*) AS count
        FROM deadlines
        WHERE "tenant_id" = ${tenantId}
          AND "created_at" >= NOW() - INTERVAL '8 weeks'
        GROUP BY week
        ORDER BY week ASC
      `,
    ]);

    // Build 8-week activity array aligned to ISO weeks
    const weeklyActivity = this.buildWeeklyActivity(weeklyCases, weeklyDeadlines);

    const STATUS_COLORS: Record<string, string> = {
      OPEN:        '#f59e0b',
      IN_PROGRESS: '#3b82f6',
      PENDING:     '#a855f7',
      CLOSED:      '#10b981',
      ARCHIVED:    '#64748b',
    };
    const STATUS_LABELS: Record<string, string> = {
      OPEN:        'Open',
      IN_PROGRESS: 'In Progress',
      PENDING:     'Pending',
      CLOSED:      'Closed',
      ARCHIVED:    'Archived',
    };

    const byStatus = workloadData.map((w) => ({
      name:  STATUS_LABELS[w.status] ?? w.status,
      value: w._count.id,
      color: STATUS_COLORS[w.status] ?? '#94a3b8',
    }));

    const byLawyer = topLawyers.map((u) => ({
      name:  `${u.firstName} ${u.lastName}`.trim(),
      cases: u._count.cases,
    }));

    return {
      counts: {
        activeCases:      activeCasesCount,
        pendingDeadlines: pendingDeadlinesCount,
        totalDocuments:   totalDocumentsCount,
        totalClients:     totalClientsCount,
      },
      deltas: {
        activeCases:      activeCasesCount - activeCasesPrev,
        pendingDeadlines: pendingDeadlinesCount - pendingDeadlinesPrev,
        totalDocuments:   totalDocumentsCount - totalDocumentsPrev,
        totalClients:     totalClientsCount - totalClientsPrev,
      },
      recentActivity,
      byStatus,
      byLawyer,
      upcomingDeadlines,
      weeklyActivity,
    };
  }

  private buildWeeklyActivity(
    cases: { week: Date; count: bigint }[],
    deadlines: { week: Date; count: bigint }[],
  ) {
    // Map week start → counts
    const caseMap     = new Map(cases.map((r) => [r.week.toISOString().slice(0, 10), Number(r.count)]));
    const deadlineMap = new Map(deadlines.map((r) => [r.week.toISOString().slice(0, 10), Number(r.count)]));

    // Build last 8 Monday-anchored week slots
    const result = [];
    const now = new Date();
    // Find last Monday
    const day = now.getDay(); // 0 = Sun
    const diff = (day === 0 ? -6 : 1 - day);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    for (let i = 7; i >= 0; i--) {
      const d = new Date(monday);
      d.setDate(monday.getDate() - i * 7);
      const key   = d.toISOString().slice(0, 10);
      const label = i === 0 ? 'W' : `W-${i}`;
      result.push({ week: label, cases: caseMap.get(key) ?? 0, deadlines: deadlineMap.get(key) ?? 0 });
    }
    return result;
  }

  async getAiDashboardData(tenantId: string) {
    const [
      summariesGenerated,
      docsAnalyzed,
      casesWithSummary,
      casesByStatus,
    ] = await Promise.all([
      this.prisma.case.count({ where: { tenantId, description: { not: null } } }),
      this.prisma.document.count({ where: { tenantId, status: 'INDEXED' } }),
      this.prisma.case.findMany({
        where: { tenantId, description: { not: null } },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, title: true, description: true, status: true, priority: true, clientName: true, updatedAt: true },
      }),
      this.prisma.case.groupBy({ by: ['status'], where: { tenantId }, _count: { id: true } }),
    ]);

    return { metrics: { summariesGenerated, urgentCases: 0, docsAnalyzed }, casesWithSummary, casesByStatus, insights: [] };
  }
}
