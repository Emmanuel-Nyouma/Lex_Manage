import {
  Controller,
  Post,
  Body,
  UseGuards,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { N8nRagService } from './n8n-rag.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { MinioService } from '../documents/minio.service';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

class AiChatDto {
  @IsString() @MinLength(1) @MaxLength(4000) message: string;
  @IsOptional() @IsString() @MaxLength(200) sessionId?: string;
  @IsOptional() @IsString() @MaxLength(200) conversationId?: string;
  @IsOptional() @IsUUID() caseId?: string;
}

class IngestDocumentDto {
  @IsUUID() documentId: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
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
    @Body() dto: AiChatDto,
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
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN', 'LAWYER')
  @ApiOperation({ summary: 'Send a DMS document to the LexAssist AI RAG knowledge base' })
  async ingestDocument(
    @Body() dto: IngestDocumentDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    // 1. Verify the document belongs to this tenant
    const access = role === 'CABINET_ADMIN' || role === 'SUPER_ADMIN'
      ? {}
      : {
          OR: [
            { allowedRoles: { isEmpty: true } },
            { allowedRoles: { has: role } },
            { uploaderId: userId },
          ],
        };
    const doc = await this.prisma.document.findFirst({
      where: { id: dto.documentId, tenantId, deletedAt: null, ...access },
    });
    if (!doc) throw new NotFoundException('Document not found');

    // Only PDF and DOCX are supported by the n8n ingest workflow
    const supported = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/x-plain'];
    if (!supported.includes(doc.file_type)) {
      throw new UnsupportedMediaTypeException(
        `File type '${doc.file_type}' is not supported for AI ingestion (PDF, DOCX, TXT only).`,
      );
    }

    // 2. Pull the file buffer from MinIO
    const buffer = await this.minio.getFileBuffer(tenantId, doc.file_url);

    // 3. Forward to the n8n ingestion webhook (fire-and-forget in n8nRagService)
    await this.n8nRag.ingestDocument({
      tenantId,
      userId,
      documentId: doc.id,
      filename: doc.file_name,
      buffer,
      caseId: doc.case_id,
    });

    return { success: true, message: `'${doc.title || doc.file_name}' is being indexed into LexAssist AI.` };
  }

  @Post('dashboard-chat')
  @ApiOperation({ summary: 'Chat with LexAssist AI from dashboard (n8n Legal RAG)' })
  async dashboardChat(
    @Body() dto: AiChatDto,
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
