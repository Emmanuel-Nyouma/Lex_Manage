import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

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
  documentId: string;
  filename: string;
  buffer: Buffer;
  caseId?: string | null;
}

interface N8nDeleteParams {
  tenantId: string;
  documentId: string;
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
  private readonly deleteUrl = process.env.N8N_RAG_DELETE_URL || '';
  private readonly webhookSecret = process.env.N8N_WEBHOOK_SECRET || '';

  /** Ask the n8n Legal RAG workflow a question, scoped to the caller's firm. */
  async chat(params: N8nChatParams): Promise<{ text: string; sources: any[]; confidence: number }> {
    if (!this.chatUrl) {
      throw new ServiceUnavailableException('The AI assistant is not configured');
    }
    try {
      const data = await this.postJson(this.chatUrl, {
        tenantId: params.tenantId,
        userId: params.userId,
        chatInput: params.chatInput,
        sessionId: params.sessionId || 'default',
        caseId: params.caseId || null,
      }, 15000);
      if (typeof data?.answer !== 'string') {
        throw new Error('n8n chat response is missing a string answer');
      }
      return {
        text: data.answer,
        sources: Array.isArray(data.sources) ? data.sources : [],
        confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      };
    } catch (err) {
      this.logger.error('n8n RAG chat failed', err as Error);
      throw new ServiceUnavailableException('The AI assistant is temporarily unavailable');
    }
  }

  /**
   * Push a document into the firm's n8n RAG knowledge base.
   * Errors are surfaced so callers can display a reliable ingestion state.
   */
  async ingestDocument(params: N8nIngestParams): Promise<void> {
    if (!this.ingestUrl) {
      throw new ServiceUnavailableException('AI document ingestion is not configured');
    }
    await this.postJson(this.ingestUrl, {
      tenantId: params.tenantId,
      userId: params.userId,
      documentId: params.documentId,
      filename: params.filename,
      fileData: params.buffer.toString('base64'),
      caseId: params.caseId || null,
    }, 30000);
    this.logger.log(
      `Document '${params.filename}' queued for RAG ingestion (tenant ${params.tenantId}).`,
    );
  }

  /**
   * Remove a document's vectors from the firm's n8n RAG knowledge base.
   * Errors are surfaced so callers can retain a retryable cleanup state.
   * Targets only the given documentId within the tenant namespace, so other
   * documents for the firm are untouched.
   */
  async deleteDocumentVectors(params: N8nDeleteParams): Promise<void> {
    if (!this.deleteUrl) {
      throw new ServiceUnavailableException('AI vector cleanup is not configured');
    }
    await this.postJson(this.deleteUrl, {
      tenantId: params.tenantId,
      documentId: params.documentId,
    }, 15000);
    this.logger.log(
      `Vectors for document '${params.documentId}' queued for RAG cleanup (tenant ${params.tenantId}).`,
    );
  }

  private async postJson(url: string, payload: Record<string, unknown>, timeoutMs: number) {
    if (!this.webhookSecret) {
      throw new ServiceUnavailableException('N8N_WEBHOOK_SECRET is not configured');
    }
    const body = JSON.stringify(payload);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.webhookSecret}`,
      },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      throw new Error(`n8n webhook returned HTTP ${res.status}`);
    }
    const raw = await res.text();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error('n8n webhook returned invalid JSON');
    }
  }
}
