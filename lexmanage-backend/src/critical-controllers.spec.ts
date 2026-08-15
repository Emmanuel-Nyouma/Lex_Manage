import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisMocks = vi.hoisted(() => ({
  connect: vi.fn(),
  ping: vi.fn(),
  quit: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  status: 'wait',
}));

vi.mock('ioredis', () => ({
  default: class MockRedis {
    get status() {
      return redisMocks.status;
    }
    connect = redisMocks.connect;
    ping = redisMocks.ping;
    quit = redisMocks.quit;
    disconnect = redisMocks.disconnect;
    on = redisMocks.on;
  },
}));

import { AppController } from './app.controller';
import { AiController } from './modules/ai/ai.controller';
import { AuthController } from './modules/auth/auth.controller';
import { DeadlinesController } from './modules/cases/deadlines.controller';

const jwt = (payload: Record<string, unknown>) =>
  `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

describe('AuthController security and cookie contracts', () => {
  const auth = {
    register: vi.fn(),
    login: vi.fn(),
    refreshToken: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
  };
  const response = { cookie: vi.fn(), clearCookie: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.ALLOWED_ORIGINS = 'https://lex.test, https://mobile.lex.test';
  });

  it('retire le refresh token des réponses register et login et pose un cookie sécurisé', async () => {
    const refreshToken = jwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    auth.register.mockResolvedValue({ accessToken: 'access', refreshToken, user: { id: 'u1' } });
    auth.login.mockResolvedValue({ accessToken: 'access-2', refreshToken, user: { id: 'u1' } });
    const controller = new AuthController(auth as any);
    const request = { get: vi.fn(() => 'https://lex.test') };

    await expect(controller.register({ email: 'a@example.com' } as any, request as any, response as any))
      .resolves.toEqual({ accessToken: 'access', user: { id: 'u1' } });
    await expect(controller.login({ email: 'a@example.com' } as any, request as any, response as any))
      .resolves.toEqual({ accessToken: 'access-2', user: { id: 'u1' } });

    expect(response.cookie).toHaveBeenCalledWith('refreshToken', refreshToken, expect.objectContaining({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: expect.any(Number),
    }));
  });

  it('refuse une origine non approuvée avant toute authentification', async () => {
    const controller = new AuthController(auth as any);
    const request = { get: vi.fn(() => 'https://evil.test') };

    await expect(controller.login({} as any, request as any, response as any))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('autorise une requête sans Origin et renouvelle le cookie même sans exp', async () => {
    const refreshToken = jwt({ sub: 'user-1' });
    auth.refreshToken.mockResolvedValue({ accessToken: 'new-access', refreshToken });
    const controller = new AuthController(auth as any);
    const request = { get: vi.fn(() => undefined), cookies: { refreshToken: 'old-token' } };

    await expect(controller.refresh(request as any, response as any))
      .resolves.toEqual({ accessToken: 'new-access' });
    expect(auth.refreshToken).toHaveBeenCalledWith('old-token');
    expect(response.cookie).toHaveBeenCalledWith('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('transmet les actions de profil et de mot de passe', () => {
    const controller = new AuthController(auth as any);
    controller.getMe('user-1');
    controller.updateProfile('user-1', { firstName: 'Ada' } as any);
    controller.requestPasswordReset({ email: 'a@example.com' });
    controller.resetPassword({ token: 'token', newPassword: 'new-password' });
    controller.changePassword('user-1', { currentPassword: 'old', newPassword: 'new' });

    expect(auth.getMe).toHaveBeenCalledWith('user-1');
    expect(auth.updateProfile).toHaveBeenCalledWith('user-1', { firstName: 'Ada' });
    expect(auth.requestPasswordReset).toHaveBeenCalledWith('a@example.com');
    expect(auth.resetPassword).toHaveBeenCalledOnce();
    expect(auth.changePassword).toHaveBeenCalledWith('user-1', expect.any(Object));
  });

  it('efface le cookie en production après logout', async () => {
    process.env.NODE_ENV = 'production';
    auth.logout.mockResolvedValue(undefined);
    const controller = new AuthController(auth as any);

    await expect(controller.logout('user-1', response as any))
      .resolves.toEqual({ message: 'Logged out successfully' });
    expect(response.clearCookie).toHaveBeenCalledWith('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  });
});

describe('AiController tenant-aware document ingestion', () => {
  const rag = { chat: vi.fn(), ingestDocument: vi.fn() };
  const prisma = { document: { findFirst: vi.fn() } };
  const storage = { getFileBuffer: vi.fn() };
  const protection = { deepDecrypt: vi.fn((value) => value) };

  beforeEach(() => vi.clearAllMocks());

  it('utilise les sessions explicites et de repli pour les deux chats', async () => {
    rag.chat.mockResolvedValue({ text: 'Réponse' });
    const controller = new AiController(rag as any, prisma as any, storage as any, protection as any);

    await controller.chat({ message: 'Question', conversationId: 'conversation-1', caseId: 'case-1' } as any, 'tenant-a', 'user-1');
    await controller.chat({ message: 'Question' } as any, 'tenant-a', 'user-1');
    await controller.dashboardChat({ message: 'Dashboard', sessionId: 'session-1' } as any, 'tenant-a', 'user-1');
    await controller.dashboardChat({ message: 'Dashboard' } as any, 'tenant-a', 'user-1');

    expect(rag.chat).toHaveBeenNthCalledWith(1, expect.objectContaining({ sessionId: 'conversation-1', caseId: 'case-1' }));
    expect(rag.chat).toHaveBeenNthCalledWith(2, expect.objectContaining({ sessionId: 'default-session' }));
    expect(rag.chat).toHaveBeenNthCalledWith(3, expect.objectContaining({ sessionId: 'session-1' }));
    expect(rag.chat).toHaveBeenNthCalledWith(4, expect.objectContaining({ sessionId: 'dashboard-session' }));
  });

  it.each(['CABINET_ADMIN', 'SUPER_ADMIN'] as const)(
    'ingère un document autorisé pour %s sans filtre de rôle',
    async (role) => {
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc-1', file_type: 'application/pdf', file_url: 'object.pdf',
        file_name: 'contrat.pdf', title: 'Contrat', case_id: 'case-1',
      });
      storage.getFileBuffer.mockResolvedValue(Buffer.from('pdf'));
      const controller = new AiController(rag as any, prisma as any, storage as any, protection as any);

      await expect(controller.ingestDocument({ documentId: 'doc-1' }, 'tenant-a', 'user-1', role))
        .resolves.toEqual({ success: true, message: "'Contrat' is being indexed into LexAssist AI." });
      expect(prisma.document.findFirst).toHaveBeenCalledWith({
        where: { id: 'doc-1', tenantId: 'tenant-a', deletedAt: null },
      });
      expect(rag.ingestDocument).toHaveBeenCalledWith(expect.objectContaining({
        tenantId: 'tenant-a', userId: 'user-1', documentId: 'doc-1',
        filename: 'contrat.pdf', caseId: 'case-1', buffer: Buffer.from('pdf'),
      }));
    },
  );

  it('applique le contrôle de visibilité aux membres et utilise le nom de fichier comme libellé', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1', file_type: 'text/plain', file_url: 'note.txt', file_name: 'note.txt',
    });
    storage.getFileBuffer.mockResolvedValue(Buffer.from('texte'));
    const controller = new AiController(rag as any, prisma as any, storage as any, protection as any);

    await expect(controller.ingestDocument({ documentId: 'doc-1' }, 'tenant-a', 'user-1', 'LAWYER'))
      .resolves.toEqual({ success: true, message: "'note.txt' is being indexed into LexAssist AI." });
    expect(prisma.document.findFirst).toHaveBeenCalledWith({ where: expect.objectContaining({
      OR: [
        { allowedRoles: { isEmpty: true } },
        { allowedRoles: { has: 'LAWYER' } },
        { uploaderId: 'user-1' },
      ],
    }) });
  });

  it('rejette un document absent ou un format non supporté avant téléchargement', async () => {
    const controller = new AiController(rag as any, prisma as any, storage as any, protection as any);
    prisma.document.findFirst.mockResolvedValueOnce(null);
    await expect(controller.ingestDocument({ documentId: 'missing' }, 'tenant-a', 'user-1', 'LAWYER'))
      .rejects.toBeInstanceOf(NotFoundException);

    prisma.document.findFirst.mockResolvedValueOnce({
      id: 'doc-2', file_type: 'image/png', file_url: 'image.png', file_name: 'image.png',
    });
    await expect(controller.ingestDocument({ documentId: 'doc-2' }, 'tenant-a', 'user-1', 'LAWYER'))
      .rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(storage.getFileBuffer).not.toHaveBeenCalled();
  });
});

describe('DeadlinesController consistency', () => {
  const prisma = {
    case: { findFirst: vi.fn() },
    deadline: { create: vi.fn(), delete: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  };
  const queue = { add: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });
    prisma.deadline.create.mockResolvedValue({ id: 'deadline-1' });
    queue.add.mockResolvedValue(undefined);
  });

  it.each(['none', 'null', ''])(
    'crée un événement global pour le caseId spécial %j',
    async (caseId) => {
      const controller = new DeadlinesController(prisma as any, queue as any);
      await controller.create('tenant-a', caseId, {
        title: 'Audience', dueAt: new Date(Date.now() + 86_400_000).toISOString(), priority: 'HIGH',
      } as any);

      expect(prisma.case.findFirst).not.toHaveBeenCalled();
      expect(prisma.deadline.create).toHaveBeenCalledWith({ data: expect.objectContaining({
        caseId: null, tenantId: 'tenant-a', dueAt: expect.any(Date),
      }) });
      expect(queue.add).toHaveBeenCalledWith('send-reminder', {
        deadlineId: 'deadline-1', tenantId: 'tenant-a',
      }, expect.objectContaining({ jobId: 'deadline-deadline-1', attempts: 3, delay: expect.any(Number) }));
    },
  );

  it('valide le dossier et borne à zéro un rappel déjà échu', async () => {
    const controller = new DeadlinesController(prisma as any, queue as any);
    await controller.create('tenant-a', 'case-1', {
      title: 'Échéance', dueAt: new Date(Date.now() - 86_400_000).toISOString(), priority: 'URGENT',
    } as any);

    expect(prisma.case.findFirst).toHaveBeenCalledWith({
      where: { id: 'case-1', tenantId: 'tenant-a' }, select: { id: true },
    });
    expect(queue.add.mock.calls[0][2].delay).toBe(0);
  });

  it('rejette un dossier étranger et annule la création si la file est indisponible', async () => {
    const controller = new DeadlinesController(prisma as any, queue as any);
    prisma.case.findFirst.mockResolvedValueOnce(null);
    await expect(controller.create('tenant-a', 'foreign-case', {
      title: 'Audience', dueAt: new Date().toISOString(), priority: 'HIGH',
    } as any)).rejects.toBeInstanceOf(NotFoundException);

    queue.add.mockRejectedValueOnce(new Error('redis offline'));
    await expect(controller.create('tenant-a', 'case-1', {
      title: 'Audience', dueAt: new Date().toISOString(), priority: 'HIGH',
    } as any)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.deadline.delete).toHaveBeenCalledWith({ where: { id: 'deadline-1' } });
  });

  it('liste, termine et supprime uniquement les échéances du tenant', async () => {
    const controller = new DeadlinesController(prisma as any, queue as any);
    prisma.deadline.findMany.mockResolvedValue([]);
    prisma.deadline.findFirst.mockResolvedValue({ id: 'deadline-1' });
    prisma.deadline.update.mockResolvedValue({ id: 'deadline-1', isDone: true });

    await controller.findAll('tenant-a', 'case-1');
    await controller.markAsDone('tenant-a', 'deadline-1');
    await expect(controller.remove('tenant-a', 'deadline-1'))
      .resolves.toEqual({ message: 'Deadline deleted' });
    expect(prisma.deadline.findMany).toHaveBeenCalledWith({
      where: { caseId: 'case-1', tenantId: 'tenant-a' }, orderBy: { dueAt: 'asc' },
    });
    expect(prisma.deadline.update).toHaveBeenCalledWith({
      where: { id: 'deadline-1' }, data: { isDone: true },
    });
  });

  it.each(['markAsDone', 'remove'] as const)('rejette %s si l’échéance est absente', async (method) => {
    prisma.deadline.findFirst.mockResolvedValue(null);
    const controller = new DeadlinesController(prisma as any, queue as any);
    await expect(controller[method]('tenant-a', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('AppController health checks', () => {
  const prisma = { $queryRaw: vi.fn() };
  const storage = { checkHealth: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    redisMocks.status = 'wait';
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redisMocks.connect.mockResolvedValue(undefined);
    redisMocks.ping.mockResolvedValue('PONG');
    redisMocks.quit.mockResolvedValue(undefined);
    storage.checkHealth.mockResolvedValue(undefined);
  });

  it('expose liveness et readiness avec chaque dépendance', async () => {
    const controller = new AppController(prisma as any, storage as any);
    expect(controller.live()).toEqual({ status: 'ok' });
    await expect(controller.health()).resolves.toEqual({
      status: 'ok', dependencies: { database: 'ok', redis: 'ok', storage: 'ok' },
    });
    expect(redisMocks.connect).toHaveBeenCalledOnce();
  });

  it('ne reconnecte pas Redis s’il est déjà connecté', async () => {
    redisMocks.status = 'ready';
    const controller = new AppController(prisma as any, storage as any);
    await controller.ready();
    expect(redisMocks.connect).not.toHaveBeenCalled();
  });

  it('retourne le détail des dépendances indisponibles', async () => {
    redisMocks.ping.mockRejectedValue(new Error('offline'));
    storage.checkHealth.mockRejectedValue(new Error('storage offline'));
    const controller = new AppController(prisma as any, storage as any);

    await expect(controller.ready()).rejects.toMatchObject({
      response: {
        code: 'DEPENDENCY_UNAVAILABLE',
        fields: { database: 'ok', redis: 'unavailable', storage: 'unavailable' },
      },
    });
  });

  it('ferme Redis proprement et utilise disconnect si quit échoue', async () => {
    redisMocks.status = 'ready';
    redisMocks.quit.mockRejectedValue(new Error('quit failed'));
    const controller = new AppController(prisma as any, storage as any);
    await controller.onModuleDestroy();
    expect(redisMocks.disconnect).toHaveBeenCalledOnce();
  });

  it('ne ferme pas deux fois une connexion déjà terminée', async () => {
    redisMocks.status = 'end';
    const controller = new AppController(prisma as any, storage as any);
    await controller.onModuleDestroy();
    expect(redisMocks.quit).not.toHaveBeenCalled();
  });
});
