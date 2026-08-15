import { ServiceUnavailableException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { N8nRagService } from './n8n-rag.service';

describe('N8nRagService webhook authentication', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.N8N_RAG_CHAT_URL;
    delete process.env.N8N_RAG_INGEST_URL;
    delete process.env.N8N_RAG_DELETE_URL;
    delete process.env.N8N_WEBHOOK_SECRET;
  });

  it('signe le corps exact avec un timestamp et un HMAC SHA-256', async () => {
    process.env.N8N_RAG_CHAT_URL = 'https://n8n.example.test/webhook/chat';
    process.env.N8N_WEBHOOK_SECRET = 'a'.repeat(32);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ answer: 'ok', sources: [], confidence: 1 }), {
        status: 200,
      }),
    );
    const service = new N8nRagService();

    await service.chat({ tenantId: 'tenant-1', userId: 'user-1', chatInput: 'question' });

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    const body = options?.body as string;
    const expected = createHmac('sha256', 'a'.repeat(32))
      .update(`${headers['X-LexManage-Timestamp']}.${body}`)
      .digest('hex');
    expect(headers['X-LexManage-Signature']).toBe(`v1=${expected}`);
    expect(headers.Authorization).toBe(`Bearer ${'a'.repeat(32)}`);
    expect(headers['X-LexManage-Request-Id']).toBeTruthy();
  });

  it('refuse le chat, l’ingestion et la suppression quand leurs webhooks ne sont pas configurés', async () => {
    const service = new N8nRagService();
    await expect(service.chat({ tenantId: 't1', userId: 'u1', chatInput: 'question' }))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(service.ingestDocument({
      tenantId: 't1', userId: 'u1', documentId: 'd1', filename: 'doc.txt', buffer: Buffer.from('x'),
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(service.deleteDocumentVectors({ tenantId: 't1', documentId: 'd1' }))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('normalise une réponse chat et applique les valeurs de repli', async () => {
    process.env.N8N_RAG_CHAT_URL = 'https://n8n.test/chat';
    process.env.N8N_WEBHOOK_SECRET = 's'.repeat(32);
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ answer: 'Réponse' })));
    const service = new N8nRagService();

    await expect(service.chat({ tenantId: 't1', userId: 'u1', chatInput: 'Q' }))
      .resolves.toEqual({ text: 'Réponse', sources: [], confidence: 0 });
    expect(JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string)).toEqual({
      tenantId: 't1', userId: 'u1', chatInput: 'Q', sessionId: 'default', caseId: null,
    });
  });

  it.each([
    ['network failure', () => Promise.reject(new Error('offline'))],
    ['HTTP failure', () => Promise.resolve(new Response('bad gateway', { status: 502 }))],
    ['invalid JSON', () => Promise.resolve(new Response('{broken'))],
    ['missing answer', () => Promise.resolve(new Response(JSON.stringify({ sources: [] })))],
  ])('convertit une erreur chat %s en indisponibilité stable', async (_label, response) => {
    process.env.N8N_RAG_CHAT_URL = 'https://n8n.test/chat';
    process.env.N8N_WEBHOOK_SECRET = 's'.repeat(32);
    global.fetch = vi.fn().mockImplementation(response);
    await expect(new N8nRagService().chat({ tenantId: 't1', userId: 'u1', chatInput: 'Q' }))
      .rejects.toMatchObject({ message: 'The AI assistant is temporarily unavailable' });
  });

  it('rejette tout webhook configuré sans secret partagé', async () => {
    process.env.N8N_RAG_CHAT_URL = 'https://n8n.test/chat';
    global.fetch = vi.fn();
    await expect(new N8nRagService().chat({ tenantId: 't1', userId: 'u1', chatInput: 'Q' }))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('envoie le document encodé en base64 avec son namespace tenant', async () => {
    process.env.N8N_RAG_INGEST_URL = 'https://n8n.test/ingest';
    process.env.N8N_WEBHOOK_SECRET = 's'.repeat(32);
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    const service = new N8nRagService();

    await service.ingestDocument({
      tenantId: 't1', userId: 'u1', documentId: 'd1', filename: 'doc.txt',
      buffer: Buffer.from('legal'), caseId: undefined,
    });
    expect(JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string)).toEqual({
      tenantId: 't1', userId: 'u1', documentId: 'd1', filename: 'doc.txt',
      fileData: Buffer.from('legal').toString('base64'), caseId: null,
    });
  });

  it('supprime uniquement les vecteurs du document dans son tenant', async () => {
    process.env.N8N_RAG_DELETE_URL = 'https://n8n.test/delete';
    process.env.N8N_WEBHOOK_SECRET = 's'.repeat(32);
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

    await new N8nRagService().deleteDocumentVectors({ tenantId: 't1', documentId: 'd1' });
    expect(JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string)).toEqual({
      tenantId: 't1', documentId: 'd1',
    });
  });
});
