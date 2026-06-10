import { Controller, Post, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { N8nRagService } from './n8n-rag.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { MinioService } from '../documents/minio.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly n8nRag: N8nRagService,
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with LexAssist AI (n8n Legal RAG)' })
  async chat(
    @Body() dto: { message: string; sessionId?: string; conversationId?: string; caseId?: string },
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.n8nRag.chat({
      tenantId,
      userId,
      chatInput: dto.message,
      sessionId: dto.sessionId || dto.conversationId || 'default-session',
      caseId: dto.caseId,
    });
  }

  @Post('ingest-document')
  @ApiOperation({ summary: 'Send a DMS document to the LexAssist AI RAG knowledge base' })
  async ingestDocument(
    @Body() dto: { documentId: string },
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    // 1. Verify the document belongs to this tenant
    const doc = await this.prisma.document.findFirst({
      where: { id: dto.documentId, tenantId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    // Only PDF and DOCX are supported by the n8n ingest workflow
    const supported = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/x-plain'];
    if (!supported.includes(doc.file_type)) {
      return { success: false, message: `File type '${doc.file_type}' is not supported for AI ingestion (PDF, DOCX, TXT only).` };
    }

    // 2. Pull the file buffer from MinIO
    const buffer = await this.minio.getFileBuffer(tenantId, doc.file_url);

    // 3. Forward to the n8n ingestion webhook (fire-and-forget in n8nRagService)
    await this.n8nRag.ingestDocument({
      tenantId,
      userId,
      filename: doc.file_name,
      buffer,
      caseId: doc.case_id,
    });

    return { success: true, message: `'${doc.title || doc.file_name}' is being indexed into LexAssist AI.` };
  }

  @Post('dashboard-chat')
  @ApiOperation({ summary: 'Chat with LexAssist AI from dashboard (n8n Legal RAG)' })
  async dashboardChat(
    @Body() dto: { message: string; sessionId?: string; conversationId?: string; caseId?: string },
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.n8nRag.chat({
      tenantId,
      userId,
      chatInput: dto.message,
      sessionId: dto.sessionId || dto.conversationId || 'dashboard-session',
      caseId: dto.caseId,
    });
  }
}
