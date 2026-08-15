import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CleanupService } from './cleanup.service';
import { MailProcessor } from './mail.processor';
import { RemindersProcessor } from './reminders.processor';

describe('workers de notifications', () => {
  describe('CleanupService', () => {
    const prisma: any = {
      document: { findMany: vi.fn(), delete: vi.fn() },
    };
    const minio = { deleteFile: vi.fn() };
    const queue = { add: vi.fn() };
    let service: CleanupService;

    beforeEach(() => {
      vi.clearAllMocks();
      service = new CleanupService(prisma, minio as any, queue as any);
    });

    it('enregistre un nettoyage quotidien unique', async () => {
      queue.add.mockResolvedValue({});
      await service.onModuleInit();
      expect(queue.add).toHaveBeenCalledWith('cleanup-abandoned-documents', {}, {
        jobId: 'cleanup-abandoned-documents', repeat: { cron: '0 3 * * *' }, removeOnComplete: true,
      });
    });

    it('supprime chaque fichier abandonné dans son contexte tenant et continue après une erreur', async () => {
      prisma.document.findMany.mockResolvedValue([
        { id: 'doc-1', tenantId: 'tenant-a', file_url: 'a.pdf' },
        { id: 'doc-2', tenantId: 'tenant-b', file_url: 'b.pdf' },
      ]);
      minio.deleteFile.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('storage offline'));
      prisma.document.delete.mockResolvedValue({});
      await service.cleanupAbandonedDocuments();
      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: { isPending: true, createdAt: { lt: expect.any(Date) } },
      });
      expect(minio.deleteFile).toHaveBeenCalledWith('tenant-a', 'a.pdf');
      expect(minio.deleteFile).toHaveBeenCalledWith('tenant-b', 'b.pdf');
      expect(prisma.document.delete).toHaveBeenCalledTimes(1);
    });
  });

  it('MailProcessor transmet exactement le contenu du job', async () => {
    const mail = { sendUrgentNotificationEmail: vi.fn().mockResolvedValue(undefined) };
    const processor = new MailProcessor(mail as any);
    const data = { firmName: 'Lex' };
    await processor.handleSendUrgentNotification({ id: 'job-1', data: { to: 'user@example.com', data } } as any);
    expect(mail.sendUrgentNotificationEmail).toHaveBeenCalledWith('user@example.com', data);
  });

  describe('RemindersProcessor', () => {
    const notifications = { create: vi.fn() };
    const prisma: any = {
      deadline: { findUnique: vi.fn() },
      scheduledNotification: { updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
    };
    const protection = { decrypt: vi.fn((value) => value) };
    let processor: RemindersProcessor;

    beforeEach(() => {
      vi.clearAllMocks();
      protection.decrypt.mockImplementation((value) => value);
      processor = new RemindersProcessor(notifications as any, prisma, protection as any);
    });

    it('ignore une échéance absente, terminée ou sans responsable', async () => {
      prisma.deadline.findUnique.mockResolvedValueOnce(null);
      await processor.handleSendReminder({ id: 'job-1', data: { deadlineId: 'd-1', tenantId: 'tenant-a' } } as any);
      prisma.deadline.findUnique.mockResolvedValueOnce({ isDone: true });
      await processor.handleSendReminder({ id: 'job-2', data: { deadlineId: 'd-2', tenantId: 'tenant-a' } } as any);
      prisma.deadline.findUnique.mockResolvedValueOnce({ isDone: false, case: null });
      await processor.handleSendReminder({ id: 'job-3', data: { deadlineId: 'd-3', tenantId: 'tenant-a' } } as any);
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('crée une notification idempotente avec le bon niveau', async () => {
      prisma.deadline.findUnique.mockResolvedValue({
        id: 'd-1', title: 'Prescription', dueAt: new Date('2026-08-20T00:00:00Z'),
        isDone: false, priority: 'URGENT', case: { title: 'Dossier Alpha', assigneeId: 'user-1' },
      });
      notifications.create.mockResolvedValue({});
      await processor.handleSendReminder({ id: 'job-1', data: { deadlineId: 'd-1', tenantId: 'tenant-a' } } as any);
      expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
        level: 'URGENT', motif: 'DEADLINE', recipientIds: ['user-1'],
        idempotencyKey: 'deadline:d-1:reminder',
      }), 'tenant-a', null);
    });

    it('utilise le niveau IMPORTANT pour une échéance non urgente', async () => {
      prisma.deadline.findUnique.mockResolvedValue({
        id: 'd-2', title: 'Audience', dueAt: new Date('2026-08-20T00:00:00Z'),
        isDone: false, priority: 'HIGH', case: { title: 'Dossier Beta', assigneeId: 'user-2' },
      });
      notifications.create.mockResolvedValue({});
      await processor.handleSendReminder({
        id: 'job-2', data: { deadlineId: 'd-2', tenantId: 'tenant-a' },
      } as any);
      expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
        level: 'IMPORTANT', recipientIds: ['user-2'],
      }), 'tenant-a', null);
    });

    it('ne traite qu’une fois une notification programmée', async () => {
      prisma.scheduledNotification.updateMany.mockResolvedValue({ count: 0 });
      await processor.handleScheduledNotification({
        id: 'job-1', data: { scheduledNotifId: 'scheduled-1', tenantId: 'tenant-a' },
      } as any);
      expect(prisma.scheduledNotification.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('revendique, envoie et marque une notification programmée comme envoyée', async () => {
      prisma.scheduledNotification.updateMany.mockResolvedValue({ count: 1 });
      prisma.scheduledNotification.findUniqueOrThrow.mockResolvedValue({
        level: 'IMPORTANT', motif: 'GENERAL', title: 'Info', message: 'Message',
        recipientRoles: ['LAWYER'], caseId: null, createdById: 'admin-1',
      });
      notifications.create.mockResolvedValue({});
      prisma.scheduledNotification.update.mockResolvedValue({});
      await processor.handleScheduledNotification({
        id: 'job-1', data: { scheduledNotifId: 'scheduled-1', tenantId: 'tenant-a' },
      } as any);
      expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
        idempotencyKey: 'scheduled:scheduled-1',
      }), 'tenant-a', 'admin-1');
      expect(prisma.scheduledNotification.update).toHaveBeenCalledWith({
        where: { id: 'scheduled-1' }, data: { status: 'SENT' },
      });
    });

    it('convertit les champs programmés null en valeurs absentes', async () => {
      prisma.scheduledNotification.updateMany.mockResolvedValue({ count: 1 });
      prisma.scheduledNotification.findUniqueOrThrow.mockResolvedValue({
        level: 'NORMAL', motif: 'OTHER', title: null, message: null,
        recipientRoles: [], caseId: 'case-1', createdById: 'admin-1',
      });
      notifications.create.mockResolvedValue({});
      prisma.scheduledNotification.update.mockResolvedValue({});
      await processor.handleScheduledNotification({
        id: 'job-1', data: { scheduledNotifId: 'scheduled-1', tenantId: 'tenant-a' },
      } as any);
      expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
        title: undefined, message: undefined, caseId: 'case-1',
      }), 'tenant-a', 'admin-1');
    });

    it('libère la revendication en cas d’échec pour permettre un retry', async () => {
      prisma.scheduledNotification.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 });
      prisma.scheduledNotification.findUniqueOrThrow.mockRejectedValue(new Error('database offline'));
      await expect(processor.handleScheduledNotification({
        id: 'job-1', data: { scheduledNotifId: 'scheduled-1', tenantId: 'tenant-a' },
      } as any)).rejects.toThrow('database offline');
      expect(prisma.scheduledNotification.updateMany).toHaveBeenLastCalledWith({
        where: { id: 'scheduled-1', status: 'PROCESSING' }, data: { status: 'PENDING' },
      });
    });
  });
});
