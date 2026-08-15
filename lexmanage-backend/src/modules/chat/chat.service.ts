import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { N8nRagService } from '../ai/n8n-rag.service';
import { Prisma } from '@prisma/client';
import { DataProtectionService } from '../security/data-protection.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private n8nRag: N8nRagService,
    private protection: DataProtectionService,
  ) {}

  async getConversations(tenantId: string, userId: string) {
    const conversations = await this.prisma.chatConversation.findMany({
      where: { tenantId, userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
    return this.protection.deepDecrypt(conversations);
  }

  async getConversation(id: string, tenantId: string, userId: string) {
    const conv = await this.prisma.chatConversation.findFirst({
      where: { id, tenantId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return this.protection.deepDecrypt(conv);
  }

  async createConversation(tenantId: string, userId: string, title?: string) {
    const conversation = await this.prisma.chatConversation.create({
      data: {
        tenantId,
        userId,
        title: this.protection.encrypt(title || 'Nouvelle conversation') as string,
      },
    });
    return this.protection.deepDecrypt(conversation);
  }

  async sendMessage(
    conversationId: string,
    message: string,
    tenantId: string,
    userId: string,
    requestId?: string,
  ) {
    // Verify ownership
    const conv = await this.prisma.chatConversation.findFirst({
      where: { id: conversationId, tenantId, userId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    if (requestId) {
      const existing = await this.prisma.chatMessage.findFirst({
        where: { conversationId, requestId, role: 'assistant' },
      });
      if (existing) {
        return { message: this.protection.decrypt(existing.content), messageId: existing.id };
      }
    }

    // Get AI response from the n8n Legal RAG workflow (tenant-isolated, per-conversation memory)
    const { text: aiResponse, sources } = await this.n8nRag.chat({
      tenantId,
      userId,
      chatInput: message,
      sessionId: conversationId,
    });

    try {
      const saved = await this.prisma.$transaction(async (tx) => {
        await tx.chatMessage.create({
            data: {
              conversationId,
              role: 'user',
              content: this.protection.encrypt(message) as string,
              requestId,
            },
        });
        const assistant = await tx.chatMessage.create({
          data: {
            conversationId,
            role: 'assistant',
            content: this.protection.encrypt(aiResponse) as string,
            sources: this.protection.encryptJson(sources) as any,
            requestId,
          },
        });
        await tx.chatConversation.update({
          where: { id: conversationId },
          data: {
            title: this.protection.encrypt(
              this.protection.decrypt(conv.title) === 'Nouvelle conversation'
                ? message.slice(0, 60)
                : this.protection.decrypt(conv.title),
            ) as string,
          },
        });
        return assistant;
      });

      return { message: aiResponse, messageId: saved.id };
    } catch (error) {
      if (requestId && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.chatMessage.findFirst({
          where: { conversationId, requestId, role: 'assistant' },
        });
        if (existing) {
          return { message: this.protection.decrypt(existing.content), messageId: existing.id };
        }
      }
      throw error;
    }
  }


  async deleteConversation(id: string, tenantId: string, userId: string) {
    const conv = await this.prisma.chatConversation.findFirst({ where: { id, tenantId, userId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    await this.prisma.chatConversation.delete({ where: { id } });
    return { message: 'Conversation deleted' };
  }
}
