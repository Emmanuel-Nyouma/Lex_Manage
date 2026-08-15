import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service';

describe('NotificationsService — contrats étendus', () => {
  const prisma: any = {
    notification: {
      findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), update: vi.fn(),
      create: vi.fn(), delete: vi.fn(),
    },
    user: { findMany: vi.fn() },
    case: { findFirst: vi.fn() },
    notificationTemplate: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    scheduledNotification: {
      findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), delete: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  const events = { sendToTenant: vi.fn() };
  const mailQueue = { addBulk: vi.fn() };
  const remindersQueue = { add: vi.fn(), getJob: vi.fn() };
  const protection = { deepDecrypt: vi.fn((value) => value) };
  let service: NotificationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    protection.deepDecrypt.mockImplementation((value) => value);
    prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) => Promise.all(promises));
    service = new NotificationsService(
      prisma, events as any, mailQueue as any, remindersQueue as any, protection as any,
    );
  });

  it('compte uniquement les notifications non lues accessibles à l’utilisateur', async () => {
    prisma.notification.count.mockResolvedValue(3);
    await expect(service.getUnreadCount('user-1', 'tenant-a')).resolves.toBe(3);
    expect(prisma.notification.count).toHaveBeenCalledWith({ where: expect.objectContaining({
      tenantId: 'tenant-a', NOT: { readByIds: { has: 'user-1' } },
    }) });
  });

  it('ne duplique pas une lecture existante et marque les autres', async () => {
    const alreadyRead = { id: 'n-1', readByIds: ['user-1'] };
    prisma.notification.findFirst.mockResolvedValueOnce(alreadyRead);
    await expect(service.markAsRead('n-1', 'user-1', 'tenant-a')).resolves.toBe(alreadyRead);
    expect(prisma.notification.update).not.toHaveBeenCalled();

    prisma.notification.findFirst.mockResolvedValueOnce({ id: 'n-2', readByIds: [] });
    prisma.notification.update.mockResolvedValue({ id: 'n-2', readByIds: ['user-1'] });
    await service.markAsRead('n-2', 'user-1', 'tenant-a');
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'n-2' }, data: { readByIds: { push: 'user-1' } },
    });
  });

  it('marque toutes les notifications en transaction et gère la liste vide', async () => {
    prisma.notification.findMany.mockResolvedValueOnce([]);
    await expect(service.markAllAsRead('user-1', 'tenant-a')).resolves.toEqual({ count: 0 });
    prisma.notification.findMany.mockResolvedValueOnce([{ id: 'n-1' }, { id: 'n-2' }]);
    prisma.notification.update.mockResolvedValue({});
    await expect(service.markAllAsRead('user-1', 'tenant-a')).resolves.toEqual({ count: 2 });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array));
    expect(prisma.notification.update).toHaveBeenCalledTimes(2);
  });

  it('retourne immédiatement une notification idempotente existante', async () => {
    const existing = { id: 'n-existing' };
    prisma.notification.findFirst.mockResolvedValue(existing);
    await expect(service.create({ idempotencyKey: 'key-1' }, 'tenant-a', null)).resolves.toBe(existing);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('crée la notification lorsqu’une clé idempotente est encore inconnue', async () => {
    prisma.notification.findFirst.mockResolvedValue(null);
    prisma.notification.create.mockResolvedValue({ id: 'n-1', level: 'NORMAL' });
    await service.create({
      idempotencyKey: 'new-key', level: 'NORMAL', motif: 'OTHER',
    }, 'tenant-a', null);
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ idempotencyKey: 'new-key' }),
    }));
  });

  it('rejette un dossier ou des destinataires extérieurs au tenant', async () => {
    prisma.case.findFirst.mockResolvedValue(null);
    await expect(service.create({ caseId: 'foreign-case' }, 'tenant-a', 'admin-1'))
      .rejects.toThrow(BadRequestException);

    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });
    prisma.user.findMany.mockResolvedValue([{ id: 'user-1' }]);
    await expect(service.create({
      caseId: 'case-1', recipientIds: ['user-1', 'foreign-user'],
    }, 'tenant-a', 'admin-1')).rejects.toThrow('One or more recipients do not belong to this firm');
  });

  it('déduplique les rôles, ajoute l’expéditeur, diffuse et programme les emails urgents', async () => {
    prisma.user.findMany
      .mockResolvedValueOnce([{ id: 'user-1' }])
      .mockResolvedValueOnce([{ id: 'user-2' }, { id: 'user-1' }])
      .mockResolvedValueOnce([
        { email: 'user1@example.com' }, { email: 'user2@example.com' }, { email: 'admin@example.com' },
      ]);
    const notification = {
      id: 'n-1', level: 'URGENT', motif: 'DEADLINE', message: 'Audience demain',
      createdAt: new Date(), tenant: { name: 'Cabinet Lex' },
      createdBy: { firstName: 'Ada', lastName: 'Admin', email: 'admin@example.com' },
    };
    prisma.notification.create.mockResolvedValue(notification);
    mailQueue.addBulk.mockResolvedValue([]);

    await service.create({
      level: 'URGENT', motif: 'DEADLINE', recipientIds: ['user-1', 'user-1'],
      recipientRoles: ['LAWYER'], message: 'Audience demain',
    }, 'tenant-a', 'admin-1');

    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ recipientIds: ['user-1', 'user-2', 'admin-1'], source: 'USER' }),
    }));
    expect(events.sendToTenant).toHaveBeenCalledWith('tenant-a', 'notification.new', notification);
    expect(mailQueue.addBulk).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        name: 'send-urgent-notification',
        opts: expect.objectContaining({ jobId: 'urgent:n-1:user1@example.com', attempts: 3 }),
      }),
    ]));
  });

  it('ne programme pas d’email pour une notification non urgente', async () => {
    prisma.notification.create.mockResolvedValue({ id: 'n-1', level: 'NORMAL' });
    await service.create({ level: 'NORMAL', motif: 'GENERAL' }, 'tenant-a', null);
    expect(mailQueue.addBulk).not.toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ source: 'SYSTEM', createdById: null, recipientIds: [] }),
    }));
  });

  it('programme une urgence générale pour tous les membres avec un expéditeur système', async () => {
    const notification = {
      id: 'n-urgent', level: 'URGENT', motif: 'OTHER', message: '', createdAt: new Date(),
      tenant: { name: 'Cabinet Lex' }, createdBy: null,
    };
    prisma.notification.create.mockResolvedValue(notification);
    prisma.user.findMany.mockResolvedValue([{ email: 'member@example.com' }]);
    mailQueue.addBulk.mockResolvedValue([]);
    await service.create({ level: 'URGENT', motif: 'OTHER' }, 'tenant-a', null);
    expect(mailQueue.addBulk).toHaveBeenCalledWith([
      expect.objectContaining({
        data: expect.objectContaining({
          data: expect.objectContaining({ senderName: 'Système LexManage' }),
        }),
      }),
    ]);
  });

  it('déchiffre l’historique et protège sa suppression par tenant', async () => {
    prisma.notification.findMany.mockResolvedValue([{ id: 'n-1' }]);
    await service.getHistory('tenant-a');
    expect(protection.deepDecrypt).toHaveBeenCalledWith([{ id: 'n-1' }]);

    prisma.notification.findFirst.mockResolvedValue(null);
    await expect(service.deleteFromHistory('tenant-a', 'foreign')).rejects.toThrow(NotFoundException);
    prisma.notification.findFirst.mockResolvedValue({ id: 'n-1' });
    prisma.notification.delete.mockResolvedValue({});
    await expect(service.deleteFromHistory('tenant-a', 'n-1')).resolves.toEqual({ message: 'Notification deleted' });
  });

  it('gère le cycle de vie des modèles', async () => {
    prisma.notificationTemplate.findMany.mockResolvedValue([{ id: 'tpl-1' }]);
    await service.getTemplates('tenant-a');
    prisma.notificationTemplate.create.mockResolvedValue({ id: 'tpl-2' });
    await service.createTemplate('tenant-a', 'admin-1', {
      name: 'Audience', level: 'IMPORTANT' as any, motif: 'GENERAL' as any,
    });
    expect(prisma.notificationTemplate.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: 'tenant-a', createdById: 'admin-1', recipientRoles: [] }),
    }));

    prisma.notificationTemplate.findFirst.mockResolvedValue(null);
    await expect(service.deleteTemplate('tenant-a', 'foreign')).rejects.toThrow(NotFoundException);
    prisma.notificationTemplate.findFirst.mockResolvedValue({ id: 'tpl-1' });
    prisma.notificationTemplate.delete.mockResolvedValue({});
    await expect(service.deleteTemplate('tenant-a', 'tpl-1')).resolves.toEqual({ message: 'Template deleted' });
  });

  it('déchiffre les notifications programmées et rejette une date passée', async () => {
    prisma.scheduledNotification.findMany.mockResolvedValue([{ id: 's-1' }]);
    await service.getScheduled('tenant-a');
    expect(protection.deepDecrypt).toHaveBeenCalledWith([{ id: 's-1' }]);
    await expect(service.createScheduled('tenant-a', 'admin-1', {
      level: 'NORMAL' as any, motif: 'GENERAL' as any, scheduledAt: '2020-01-01T00:00:00Z',
    })).rejects.toThrow('Scheduled date must be in the future');
  });

  it('rejette un dossier planifié extérieur au tenant', async () => {
    prisma.case.findFirst.mockResolvedValue(null);
    await expect(service.createScheduled('tenant-a', 'admin-1', {
      level: 'NORMAL' as any,
      motif: 'OTHER' as any,
      scheduledAt: new Date(Date.now() + 60_000).toISOString(),
      caseId: 'foreign-case',
    })).rejects.toThrow('Case does not belong to this firm');
  });

  it('crée une programmation, persiste le job et déchiffre le résultat', async () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });
    prisma.scheduledNotification.create.mockResolvedValue({ id: 's-1' });
    remindersQueue.add.mockResolvedValue({ id: 'bull-1' });
    prisma.scheduledNotification.update.mockResolvedValue({ id: 's-1', jobId: 'bull-1' });
    await service.createScheduled('tenant-a', 'admin-1', {
      level: 'IMPORTANT' as any, motif: 'GENERAL' as any, scheduledAt: future, caseId: 'case-1',
      recipientRoles: ['LAWYER'] as any,
    });
    expect(remindersQueue.add).toHaveBeenCalledWith(
      'send-scheduled-notification', { scheduledNotifId: 's-1', tenantId: 'tenant-a' },
      expect.objectContaining({ jobId: 'sched-s-1', attempts: 3 }),
    );
    expect(prisma.scheduledNotification.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { jobId: 'bull-1' },
    }));
    expect(prisma.scheduledNotification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ recipientRoles: ['LAWYER'] }),
    }));
  });

  it('supprime la ligne si Bull refuse la programmation', async () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    prisma.scheduledNotification.create.mockResolvedValue({ id: 's-1' });
    remindersQueue.add.mockRejectedValue(new Error('redis offline'));
    prisma.scheduledNotification.delete.mockResolvedValue({});
    await expect(service.createScheduled('tenant-a', 'admin-1', {
      level: 'NORMAL' as any, motif: 'GENERAL' as any, scheduledAt: future,
    })).rejects.toThrow(ServiceUnavailableException);
    expect(prisma.scheduledNotification.delete).toHaveBeenCalledWith({ where: { id: 's-1' } });
  });

  it('annule seulement un envoi PENDING et retire son job', async () => {
    prisma.scheduledNotification.findFirst.mockResolvedValueOnce(null);
    await expect(service.cancelScheduled('tenant-a', 'missing')).rejects.toThrow(NotFoundException);
    prisma.scheduledNotification.findFirst.mockResolvedValueOnce({ id: 's-1', status: 'SENT' });
    await expect(service.cancelScheduled('tenant-a', 's-1')).rejects.toThrow(BadRequestException);

    const remove = vi.fn().mockResolvedValue(undefined);
    prisma.scheduledNotification.findFirst.mockResolvedValueOnce({ id: 's-2', status: 'PENDING', jobId: 'bull-2' });
    remindersQueue.getJob.mockResolvedValue({ remove });
    prisma.scheduledNotification.update.mockResolvedValue({ id: 's-2', status: 'CANCELLED' });
    await service.cancelScheduled('tenant-a', 's-2');
    expect(remove).toHaveBeenCalled();
  });

  it('signale une panne Redis lors d’une annulation', async () => {
    prisma.scheduledNotification.findFirst.mockResolvedValue({ id: 's-1', status: 'PENDING', jobId: 'bull-1' });
    remindersQueue.getJob.mockRejectedValue(new Error('redis offline'));
    await expect(service.cancelScheduled('tenant-a', 's-1')).rejects.toThrow(ServiceUnavailableException);
  });

  it('annule sans job ou avec un identifiant Bull déjà absent', async () => {
    prisma.scheduledNotification.update.mockResolvedValue({ id: 's-1', status: 'CANCELLED' });
    prisma.scheduledNotification.findFirst.mockResolvedValueOnce({ id: 's-1', status: 'PENDING', jobId: null });
    await service.cancelScheduled('tenant-a', 's-1');
    expect(remindersQueue.getJob).not.toHaveBeenCalled();

    prisma.scheduledNotification.findFirst.mockResolvedValueOnce({ id: 's-2', status: 'PENDING', jobId: 'missing' });
    remindersQueue.getJob.mockResolvedValue(null);
    await service.cancelScheduled('tenant-a', 's-2');
    expect(remindersQueue.getJob).toHaveBeenCalledWith('missing');
  });

  it('supprime définitivement un envoi et son job restant', async () => {
    prisma.scheduledNotification.findFirst.mockResolvedValueOnce(null);
    await expect(service.deleteScheduled('tenant-a', 'missing')).rejects.toThrow(NotFoundException);

    const remove = vi.fn().mockResolvedValue(undefined);
    prisma.scheduledNotification.findFirst.mockResolvedValueOnce({ id: 's-1', status: 'PENDING', jobId: 'bull-1' });
    remindersQueue.getJob.mockResolvedValue({ remove });
    prisma.scheduledNotification.delete.mockResolvedValue({});
    await expect(service.deleteScheduled('tenant-a', 's-1')).resolves.toEqual({
      message: 'Scheduled notification deleted',
    });
    expect(remove).toHaveBeenCalled();
  });

  it('signale une panne Redis lors de la suppression définitive', async () => {
    prisma.scheduledNotification.findFirst.mockResolvedValue({
      id: 's-1', status: 'PENDING', jobId: 'bull-1',
    });
    remindersQueue.getJob.mockRejectedValue(new Error('redis offline'));
    await expect(service.deleteScheduled('tenant-a', 's-1'))
      .rejects.toThrow(ServiceUnavailableException);
    expect(prisma.scheduledNotification.delete).not.toHaveBeenCalled();
  });

  it('supprime un envoi non pending, sans job, ou dont le job a déjà disparu', async () => {
    prisma.scheduledNotification.delete.mockResolvedValue({});
    for (const record of [
      { id: 's-sent', status: 'SENT', jobId: 'old-job' },
      { id: 's-no-job', status: 'PENDING', jobId: null },
      { id: 's-missing-job', status: 'PENDING', jobId: 'missing' },
    ]) {
      prisma.scheduledNotification.findFirst.mockResolvedValueOnce(record);
      remindersQueue.getJob.mockResolvedValueOnce(null);
      await expect(service.deleteScheduled('tenant-a', record.id))
        .resolves.toEqual({ message: 'Scheduled notification deleted' });
    }
  });
});
