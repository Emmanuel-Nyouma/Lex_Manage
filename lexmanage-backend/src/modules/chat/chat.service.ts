import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { N8nRagService } from '../ai/n8n-rag.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private n8nRag: N8nRagService,
  ) {}

  async getConversations(tenantId: string, userId: string) {
    return this.prisma.chatConversation.findMany({
      where: { tenantId, userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
  }

  async getConversation(id: string, tenantId: string, userId: string) {
    const conv = await this.prisma.chatConversation.findFirst({
      where: { id, tenantId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async createConversation(tenantId: string, userId: string, title?: string) {
    return this.prisma.chatConversation.create({
      data: { tenantId, userId, title: title || 'Nouvelle conversation' },
    });
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
        return { message: existing.content, messageId: existing.id };
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
          data: { conversationId, role: 'user', content: message, requestId },
        });
        const assistant = await tx.chatMessage.create({
          data: {
            conversationId,
            role: 'assistant',
            content: aiResponse,
            sources: sources as any,
            requestId,
          },
        });
        await tx.chatConversation.update({
          where: { id: conversationId },
          data: {
            title: conv.title === 'Nouvelle conversation' ? message.slice(0, 60) : conv.title,
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
        if (existing) return { message: existing.content, messageId: existing.id };
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
