import { createHmac } from 'crypto';
import { N8nRagService } from './n8n-rag.service';

describe('N8nRagService webhook authentication', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.N8N_RAG_CHAT_URL;
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
});
