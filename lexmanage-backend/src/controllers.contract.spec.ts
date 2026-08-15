import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditController } from './modules/audit/audit.controller';
import { CalendarController } from './modules/calendar/calendar.controller';
import { CaseDocumentsController } from './modules/case-documents/case-documents.controller';
import { CasesController } from './modules/cases/cases.controller';
import { ChatController } from './modules/chat/chat.controller';
import { ClientsController } from './modules/clients/clients.controller';
import { DocumentsController } from './modules/documents/documents.controller';
import { NotificationsController } from './modules/notifications/notifications.controller';
import { SearchController } from './modules/search/search.controller';
import { StatsController } from './modules/stats/stats.controller';
import { TenantsController } from './modules/tenants/tenants.controller';
import { UsersController } from './modules/users/users.controller';

const method = () => vi.fn((...args: unknown[]) => args);

describe('contrats des contrôleurs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('borne la pagination des dossiers et transmet l’identité tenant', () => {
    const service: any = { findAll: method(), findOne: method(), create: method(), update: method(), remove: method() };
    const controller = new CasesController(service);

    controller.findAll('tenant-a', 'cursor-1', '500');
    expect(service.findAll).toHaveBeenCalledWith('tenant-a', 'cursor-1', 100);
    controller.findAll('tenant-a', undefined, 'invalid');
    expect(service.findAll).toHaveBeenLastCalledWith('tenant-a', undefined, 10);
    controller.findOne('case-1', 'tenant-a');
    controller.create({ title: 'Dossier' }, { tenantId: 'tenant-a', id: 'user-1' });
    controller.update('case-1', { title: 'Nouveau' }, 'tenant-a', 'user-1');
    controller.remove('case-1', 'tenant-a', 'user-1');
    expect(service.findOne).toHaveBeenCalledWith('case-1', 'tenant-a');
    expect(service.create).toHaveBeenCalledWith({ title: 'Dossier' }, 'tenant-a', 'user-1');
    expect(service.update).toHaveBeenCalledWith('case-1', { title: 'Nouveau' }, 'tenant-a', 'user-1');
    expect(service.remove).toHaveBeenCalledWith('case-1', 'tenant-a', 'user-1');
  });

  it('transmet tous les contrats clients', () => {
    const service: any = { findAll: method(), findOne: method(), create: method(), update: method(), remove: method() };
    const controller = new ClientsController(service);
    controller.findAll('tenant-a');
    controller.findOne('client-1', 'tenant-a');
    controller.create({ name: 'Client' }, 'tenant-a', 'user-1');
    controller.update('client-1', { name: 'Nouveau' }, 'tenant-a', 'user-1');
    controller.remove('client-1', 'tenant-a', 'user-1');
    expect(service.findAll).toHaveBeenCalledWith('tenant-a');
    expect(service.findOne).toHaveBeenCalledWith('client-1', 'tenant-a');
    expect(service.create).toHaveBeenCalledWith({ name: 'Client' }, 'tenant-a', 'user-1');
    expect(service.update).toHaveBeenCalledWith('client-1', { name: 'Nouveau' }, 'tenant-a', 'user-1');
    expect(service.remove).toHaveBeenCalledWith('client-1', 'tenant-a', 'user-1');
  });

  it('transmet tous les contrats utilisateurs', () => {
    const service: any = {
      findAll: method(), findColleagues: method(), findOne: method(),
      create: method(), update: method(), deactivate: method(),
    };
    const controller = new UsersController(service);
    controller.findAll('tenant-a');
    controller.findColleagues('tenant-a');
    controller.findOne('user-2', 'tenant-a');
    controller.create({ email: 'user@example.com' }, 'tenant-a', 'admin-1');
    controller.update('user-2', { firstName: 'Ada' }, 'tenant-a', 'admin-1');
    controller.deactivate('user-2', 'tenant-a', 'admin-1');
    expect(service.findColleagues).toHaveBeenCalledWith('tenant-a');
    expect(service.deactivate).toHaveBeenCalledWith('user-2', 'tenant-a', 'admin-1');
  });

  it('transmet les actions cabinet et bloque l’auto-désactivation au contrôleur', () => {
    const service: any = {
      getMyTenant: method(), updateTenant: method(), uploadLogo: method(), getMembers: method(),
      createInvitation: method(), getInvitations: method(), revokeInvitation: method(),
      updateMember: method(), deactivateMember: method(),
    };
    const controller = new TenantsController(service);
    const file = { originalname: 'logo.png' } as any;
    controller.getMyTenant('tenant-a');
    controller.updateTenant('tenant-a', { name: 'Lex' });
    controller.uploadLogo('tenant-a', file);
    controller.getMembers('tenant-a');
    controller.createInvitation('tenant-a', { email: 'new@example.com', role: 'LAWYER' as any });
    controller.getInvitations('tenant-a');
    controller.revokeInvitation('tenant-a', 'invite-1');
    controller.updateMember('tenant-a', 'admin-1', 'member-1', { role: 'ASSISTANT' as any });
    controller.deactivateMember('tenant-a', 'admin-1', 'member-1');
    expect(service.uploadLogo).toHaveBeenCalledWith('tenant-a', file);
    expect(service.updateMember).toHaveBeenCalledWith(
      'tenant-a', 'admin-1', 'member-1', { role: 'ASSISTANT' },
    );
    expect(() => controller.deactivateMember('tenant-a', 'admin-1', 'admin-1'))
      .toThrow(BadRequestException);
  });

  it('transmet toutes les actions de notification dans le bon ordre', () => {
    const service: any = {
      findAll: method(), getUnreadCount: method(), create: method(), markAllAsRead: method(),
      markAsRead: method(), getHistory: method(), deleteFromHistory: method(), getTemplates: method(),
      createTemplate: method(), deleteTemplate: method(), getScheduled: method(),
      createScheduled: method(), cancelScheduled: method(), deleteScheduled: method(),
    };
    const controller = new NotificationsController(service);
    controller.findAll('user-1', 'tenant-a');
    controller.getUnreadCount('user-1', 'tenant-a');
    controller.create({ title: 'Info', message: 'Message' } as any, 'tenant-a', 'admin-1');
    controller.markAllAsRead('user-1', 'tenant-a');
    controller.markAsRead('notification-1', 'user-1', 'tenant-a');
    controller.getHistory('tenant-a');
    controller.deleteFromHistory('tenant-a', 'notification-1');
    controller.getTemplates('tenant-a');
    controller.createTemplate('tenant-a', 'admin-1', { name: 'Template' } as any);
    controller.deleteTemplate('tenant-a', 'template-1');
    controller.getScheduled('tenant-a');
    controller.createScheduled('tenant-a', 'admin-1', { title: 'Later' } as any);
    controller.cancelScheduled('tenant-a', 'scheduled-1');
    controller.deleteScheduled('tenant-a', 'scheduled-1');
    expect(service.markAsRead).toHaveBeenCalledWith('notification-1', 'user-1', 'tenant-a');
    expect(service.createTemplate).toHaveBeenCalledWith('tenant-a', 'admin-1', { name: 'Template' });
    expect(service.createScheduled).toHaveBeenCalledWith('tenant-a', 'admin-1', { title: 'Later' });
  });

  it('gère les branches de liste et valide allowedRoles pour les documents', () => {
    const service: any = {
      findByCase: method(), findAll: method(), findOne: method(), getSignedUrl: method(),
      upload: method(), create: method(), update: method(), linkDocumentToCase: method(), remove: method(),
    };
    const controller = new DocumentsController(service);
    controller.findAll('tenant-a', 'user-1', 'LAWYER' as any, 'case-1');
    expect(service.findByCase).toHaveBeenCalledWith('case-1', 'tenant-a', 'user-1', 'LAWYER');
    controller.findAll('tenant-a', 'user-1', 'LAWYER' as any, undefined, 'cursor-1', '999', 'LEGAL', 'contrat');
    expect(service.findAll).toHaveBeenCalledWith(
      'tenant-a', 'user-1', 'LAWYER', 'cursor-1', 100, 'LEGAL', 'contrat',
    );
    controller.findOne('doc-1', 'tenant-a', 'user-1', 'LAWYER' as any);
    controller.getDownloadUrl('doc-1', 'tenant-a', 'user-1', 'LAWYER' as any);
    const file = { originalname: 'doc.pdf' } as any;
    controller.upload(
      file, 'Contrat', 'OTHER' as any, 'LEGAL', undefined,
      JSON.stringify(['LAWYER', 'LAWYER']), 'case-body', undefined, 'case-query', 'true',
      'tenant-a', 'user-1',
    );
    expect(service.upload).toHaveBeenCalledWith(file, 'tenant-a', 'user-1', expect.objectContaining({
      allowedRoles: ['LAWYER'], caseId: 'case-body', pending: true,
    }));
    expect(() => controller.upload(
      file, undefined, undefined, undefined, undefined, '["INVALID"]',
      undefined, undefined, undefined, undefined, 'tenant-a', 'user-1',
    )).toThrow(BadRequestException);
    controller.create({ title: 'Doc' } as any, 'tenant-a', 'user-1');
    controller.update('doc-1', { title: 'Updated' }, 'tenant-a', 'user-1', 'LAWYER' as any);
    controller.linkToCase('doc-1', 'case-1', 'tenant-a', 'user-1');
    controller.remove('doc-1', 'tenant-a', 'user-1', 'CABINET_ADMIN' as any);
  });

  it('transmet les contrats chat avec le requestId', () => {
    const service: any = {
      getConversations: method(), createConversation: method(), getConversation: method(),
      sendMessage: method(), deleteConversation: method(),
    };
    const controller = new ChatController(service);
    const user = { tenantId: 'tenant-a', id: 'user-1' };
    controller.getConversations(user);
    controller.createConversation(user);
    controller.getConversation('conv-1', user);
    controller.sendMessage('conv-1', { message: 'Question', requestId: 'f76c83bf-3301-4c4d-a224-5b46ade3c86b' }, user);
    controller.deleteConversation('conv-1', user);
    expect(service.sendMessage).toHaveBeenCalledWith(
      'conv-1', 'Question', 'tenant-a', 'user-1', 'f76c83bf-3301-4c4d-a224-5b46ade3c86b',
    );
  });

  it('transmet recherche, audit et statistiques', () => {
    const search: any = { globalSearch: method() };
    new SearchController(search).globalSearch('tenant-a', 'user-1', 'LAWYER' as any, 'contrat');
    expect(search.globalSearch).toHaveBeenCalledWith('tenant-a', 'user-1', 'LAWYER', 'contrat');

    const audit: any = { getLogs: method() };
    const auditController = new AuditController(audit);
    auditController.getLogs('tenant-a', 0, 'cursor-1');
    expect(audit.getLogs).toHaveBeenCalledWith('tenant-a', 1, 'cursor-1');
    auditController.getLogs('tenant-a', Number.NaN);
    expect(audit.getLogs).toHaveBeenLastCalledWith('tenant-a', 50, undefined);

    const stats: any = { getDashboardStats: method(), getAiDashboardData: method() };
    const statsController = new StatsController(stats);
    statsController.getDashboardStats('tenant-a');
    statsController.getAiDashboardData('tenant-a');
    expect(stats.getDashboardStats).toHaveBeenCalledWith('tenant-a');
    expect(stats.getAiDashboardData).toHaveBeenCalledWith('tenant-a');
  });

  it('scope le calendrier et les liaisons document-dossier', async () => {
    const prisma: any = { deadline: { findMany: method() } };
    await new CalendarController(prisma).findAll('tenant-a');
    expect(prisma.deadline.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant-a' }, orderBy: { dueAt: 'asc' },
    }));

    const links: any = { link: method(), unlink: method() };
    const controller = new CaseDocumentsController(links);
    controller.link('case-1', 'doc-1', 'tenant-a');
    controller.unlink('case-1', 'doc-1', 'tenant-a');
    expect(links.link).toHaveBeenCalledWith('case-1', 'doc-1', 'tenant-a');
    expect(links.unlink).toHaveBeenCalledWith('case-1', 'doc-1', 'tenant-a');
  });
});
