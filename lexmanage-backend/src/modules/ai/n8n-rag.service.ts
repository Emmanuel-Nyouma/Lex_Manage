import { Injectable, Logger } from '@nestjs/common';

interface N8nChatParams {
  tenantId: string;
  userId: string;
  chatInput: string;
  sessionId?: string;
  caseId?: string | null;
}

interface N8nIngestParams {
  tenantId: string;
  userId: string;
  filename: string;
  buffer: Buffer;
  caseId?: string | null;
}

/**
 * Bridges lex-manage to the external n8n "Legal RAG" workflow.
 * All calls are scoped by tenantId (per-firm isolation) + userId.
 */
@Injectable()
export class N8nRagService {
  private readonly logger = new Logger(N8nRagService.name);
  private readonly chatUrl = process.env.N8N_RAG_CHAT_URL || '';
  private readonly ingestUrl = process.env.N8N_RAG_INGEST_URL || '';

  /** Ask the n8n Legal RAG workflow a question, scoped to the caller's firm. */
  async chat(params: N8nChatParams): Promise<{ text: string; sources: any[]; confidence: number }> {
    if (!this.chatUrl) {
      this.logger.warn('N8N_RAG_CHAT_URL not set — AI chat is disabled.');
      return { text: 'The AI assistant is not configured.', sources: [], confidence: 0 };
    }
    try {
      const res = await fetch(this.chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: params.tenantId,
          userId: params.userId,
          chatInput: params.chatInput,
          sessionId: params.sessionId || 'default',
          caseId: params.caseId || null,
        }),
      });
      if (!res.ok) {
        throw new Error(`n8n chat webhook returned HTTP ${res.status}`);
      }
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      return {
        text: data.answer ?? 'No response from the AI service.',
        sources: data.sources ?? [],
        confidence: data.confidence ?? 0,
      };
    } catch (err) {
      this.logger.error('n8n RAG chat failed', err as Error);
      return {
        text: 'The AI assistant is temporarily unavailable. Please try again.',
        sources: [],
        confidence: 0,
      };
    }
  }

  /**
   * Push a document into the firm's n8n RAG knowledge base.
   * Fire-and-forget: failures are logged but never block the upload.
   */
  async ingestDocument(params: N8nIngestParams): Promise<void> {
    if (!this.ingestUrl) {
      this.logger.warn('N8N_RAG_INGEST_URL not set — skipping RAG ingestion.');
      return;
    }
    try {
      const res = await fetch(this.ingestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: params.tenantId,
          userId: params.userId,
          filename: params.filename,
          fileData: params.buffer.toString('base64'),
          caseId: params.caseId || null,
        }),
      });
      if (!res.ok) {
        throw new Error(`n8n ingest webhook returned HTTP ${res.status}`);
      }
      this.logger.log(
        `Document '${params.filename}' queued for RAG ingestion (tenant ${params.tenantId}).`,
      );
    } catch (err) {
      this.logger.error(`n8n RAG ingestion failed for '${params.filename}'`, err as Error);
    }
  }
}
