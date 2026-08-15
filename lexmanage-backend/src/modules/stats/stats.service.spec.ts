import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  const prisma: any = {
    case: { count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
    deadline: { count: vi.fn(), findMany: vi.fn() },
    document: { count: vi.fn() },
    client: { count: vi.fn() },
    auditLog: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  };
  const protection = { deepDecrypt: vi.fn((value) => value) };
  let service: StatsService;

  beforeEach(() => {
    vi.clearAllMocks();
    protection.deepDecrypt.mockImplementation((value) => value);
    service = new StatsService(prisma, protection as any);
  });

  it('agrège les compteurs, deltas, charges et huit semaines d’activité', async () => {
    prisma.case.count.mockResolvedValueOnce(12).mockResolvedValueOnce(8);
    prisma.deadline.count.mockResolvedValueOnce(5).mockResolvedValueOnce(3);
    prisma.document.count.mockResolvedValueOnce(20).mockResolvedValueOnce(15);
    prisma.client.count.mockResolvedValueOnce(9).mockResolvedValueOnce(7);
    prisma.auditLog.findMany.mockResolvedValue([{ id: 'log-1', details: 'encrypted' }]);
    prisma.case.groupBy.mockResolvedValue([
      { status: 'OPEN', _count: { id: 4 } },
      { status: 'CUSTOM', _count: { id: 2 } },
    ]);
    prisma.user.findMany.mockResolvedValue([
      { firstName: 'Ada', lastName: 'Lovelace', _count: { cases: 6 } },
    ]);
    prisma.deadline.findMany.mockResolvedValue([{ id: 'deadline-1' }]);
    prisma.$queryRaw
      .mockResolvedValueOnce([{ week: new Date('2026-08-10T00:00:00.000Z'), count: 2n }])
      .mockResolvedValueOnce([{ week: new Date('2026-08-10T00:00:00.000Z'), count: 3n }]);

    const result = await service.getDashboardStats('tenant-a');

    expect(result.counts).toEqual({ activeCases: 12, pendingDeadlines: 5, totalDocuments: 20, totalClients: 9 });
    expect(result.deltas).toEqual({ activeCases: 4, pendingDeadlines: 2, totalDocuments: 5, totalClients: 2 });
    expect(result.byStatus).toEqual([
      { name: 'Open', value: 4, color: '#f59e0b' },
      { name: 'CUSTOM', value: 2, color: '#94a3b8' },
    ]);
    expect(result.byLawyer).toEqual([{ name: 'Ada Lovelace', cases: 6 }]);
    expect(result.weeklyActivity).toHaveLength(8);
    expect(result.weeklyActivity.at(-1)).toEqual(expect.objectContaining({ week: 'W' }));
    expect(protection.deepDecrypt).toHaveBeenCalledTimes(2);
  });

  it('retourne les métriques IA et déchiffre les résumés', async () => {
    prisma.case.count.mockResolvedValue(4);
    prisma.document.count.mockResolvedValue(7);
    prisma.case.findMany.mockResolvedValue([{ id: 'case-1', description: 'encrypted' }]);
    prisma.case.groupBy.mockResolvedValue([{ status: 'OPEN', _count: { id: 2 } }]);

    await expect(service.getAiDashboardData('tenant-a')).resolves.toEqual({
      metrics: { summariesGenerated: 4, urgentCases: 0, docsAnalyzed: 7 },
      casesWithSummary: [{ id: 'case-1', description: 'encrypted' }],
      casesByStatus: [{ status: 'OPEN', _count: { id: 2 } }],
      insights: [],
    });
    expect(prisma.case.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', description: { not: null } },
    });
  });
});
