import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  const prisma: any = {
    chatConversation: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    chatMessage: { findFirst: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  };
  const n8n = { chat: vi.fn() };
  const protection = {
    encrypt: vi.fn((value) => `encrypted:${value}`),
    decrypt: vi.fn((value) => String(value).replace(/^encrypted:/, '')),
    encryptJson: vi.fn((value) => `json:${JSON.stringify(value)}`),
    deepDecrypt: vi.fn((value) => value),
  };
  let service: ChatService;

  beforeEach(() => {
    vi.clearAllMocks();
    protection.encrypt.mockImplementation((value) => `encrypted:${value}`);
    protection.decrypt.mockImplementation((value) => String(value).replace(/^encrypted:/, ''));
    protection.deepDecrypt.mockImplementation((value) => value);
    prisma.$transaction.mockImplementation((callback: (tx: any) => unknown) => callback(prisma));
    service = new ChatService(prisma, n8n as any, protection as any);
  });

  it('scope et déchiffre les conversations du propriétaire', async () => {
    prisma.chatConversation.findMany.mockResolvedValue([{ id: 'conv-1' }]);
    await expect(service.getConversations('tenant-a', 'user-1')).resolves.toEqual([{ id: 'conv-1' }]);
    expect(prisma.chatConversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant-a', userId: 'user-1' },
    }));
  });

  it('rejette une conversation absente ou appartenant à un autre utilisateur', async () => {
    prisma.chatConversation.findFirst.mockResolvedValue(null);
    await expect(service.getConversation('conv-x', 'tenant-a', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('chiffre le titre par défaut à la création', async () => {
    prisma.chatConversation.create.mockResolvedValue({ id: 'conv-1', title: 'encrypted:Nouvelle conversation' });
    await service.createConversation('tenant-a', 'user-1');
    expect(prisma.chatConversation.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-a', userId: 'user-1', title: 'encrypted:Nouvelle conversation' },
    });
  });

  it('rend une réponse idempotente existante sans rappeler n8n', async () => {
    prisma.chatConversation.findFirst.mockResolvedValue({ id: 'conv-1' });
    prisma.chatMessage.findFirst.mockResolvedValue({ id: 'msg-2', content: 'encrypted:Réponse' });

    await expect(service.sendMessage('conv-1', 'Question', 'tenant-a', 'user-1', 'request-1'))
      .resolves.toEqual({ message: 'Réponse', messageId: 'msg-2' });
    expect(n8n.chat).not.toHaveBeenCalled();
  });

  it('enregistre atomiquement les deux messages et renomme une nouvelle conversation', async () => {
    prisma.chatConversation.findFirst.mockResolvedValue({ id: 'conv-1', title: 'encrypted:Nouvelle conversation' });
    prisma.chatMessage.findFirst.mockResolvedValue(null);
    prisma.chatMessage.create
      .mockResolvedValueOnce({ id: 'msg-user' })
      .mockResolvedValueOnce({ id: 'msg-ai' });
    n8n.chat.mockResolvedValue({ text: 'Réponse IA', sources: [{ id: 'doc-1' }] });

    await expect(service.sendMessage(
      'conv-1', 'Une question juridique très précise', 'tenant-a', 'user-1', 'request-1',
    )).resolves.toEqual({ message: 'Réponse IA', messageId: 'msg-ai' });

    expect(n8n.chat).toHaveBeenCalledWith({
      tenantId: 'tenant-a', userId: 'user-1',
      chatInput: 'Une question juridique très précise', sessionId: 'conv-1',
    });
    expect(prisma.chatMessage.create).toHaveBeenCalledTimes(2);
    expect(prisma.chatConversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { title: 'encrypted:Une question juridique très précise' },
    });
  });

  it('conserve un titre existant', async () => {
    prisma.chatConversation.findFirst.mockResolvedValue({ id: 'conv-1', title: 'encrypted:Dossier Alpha' });
    prisma.chatMessage.create
      .mockResolvedValueOnce({ id: 'msg-user' })
      .mockResolvedValueOnce({ id: 'msg-ai' });
    n8n.chat.mockResolvedValue({ text: 'Réponse', sources: [] });
    await service.sendMessage('conv-1', 'Suite', 'tenant-a', 'user-1');
    expect(prisma.chatConversation.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { title: 'encrypted:Dossier Alpha' },
    }));
  });

  it('supprime uniquement une conversation possédée par l’utilisateur', async () => {
    prisma.chatConversation.findFirst.mockResolvedValue({ id: 'conv-1' });
    await expect(service.deleteConversation('conv-1', 'tenant-a', 'user-1'))
      .resolves.toEqual({ message: 'Conversation deleted' });
    expect(prisma.chatConversation.delete).toHaveBeenCalledWith({ where: { id: 'conv-1' } });
  });
});
