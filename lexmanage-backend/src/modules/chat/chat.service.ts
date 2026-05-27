import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async getConversations(tenantId: string, userId: string) {
    return this.prisma.chatConversation.findMany({
      where: { tenantId, userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
  }

  async getConversation(id: string, tenantId: string) {
    const conv = await this.prisma.chatConversation.findFirst({
      where: { id, tenantId },
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

  async sendMessage(conversationId: string, message: string, tenantId: string, userId: string) {
    // Verify ownership
    const conv = await this.prisma.chatConversation.findFirst({
      where: { id: conversationId, tenantId, userId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    // Save user message
    await this.prisma.chatMessage.create({
      data: { conversationId, role: 'user', content: message },
    });

    // Get AI response (RAG + Gemini)
    const { text: aiResponse, sources } = await this.ai.chat(message, conversationId, tenantId);

    // Save assistant response
    const saved = await this.prisma.chatMessage.create({
      data: { 
        conversationId, 
        role: 'assistant', 
        content: aiResponse,
        sources: sources as any,
      },
    });

    // Update conversation timestamp
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { title: conv.title === 'Nouvelle conversation' ? message.slice(0, 60) : conv.title },
    });

    return { message: aiResponse, messageId: saved.id };
  }


  async deleteConversation(id: string, tenantId: string, userId: string) {
    const conv = await this.prisma.chatConversation.findFirst({ where: { id, tenantId, userId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    await this.prisma.chatConversation.delete({ where: { id } });
    return { message: 'Conversation deleted' };
  }
}
