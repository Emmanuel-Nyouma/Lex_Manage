import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MailService } from './mail.service';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));

describe('MailService', () => {
  const config = (values: Record<string, string | undefined>) => ({
    get: vi.fn((key: string) => values[key]),
  });

  beforeEach(() => vi.clearAllMocks());

  it('ignore proprement les emails lorsque Resend est désactivé', async () => {
    const service = new MailService(config({}) as any);
    await expect(service.sendUrgentNotificationEmail('user@example.com', {
      firmName: 'Lex', motifLabel: 'Audience', senderName: 'Admin', timestamp: new Date(),
    })).resolves.toBeUndefined();
    await expect(service.sendPasswordResetEmail('user@example.com', 'https://example.test/reset'))
      .resolves.toBeUndefined();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('échappe le HTML dans les notifications urgentes', async () => {
    mocks.send.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    const service = new MailService(config({ RESEND_API_KEY: 'key', MAIL_FROM: 'mail@lex.test' }) as any);
    await service.sendUrgentNotificationEmail('user@example.com', {
      firmName: '<Lex & Co>', motifLabel: 'Audience "urgente"',
      message: '<script>alert(1)</script>', senderName: "O'Neil", timestamp: new Date(),
    });
    const payload = mocks.send.mock.calls[0][0];
    expect(payload.from).toContain('&lt;Lex &amp; Co&gt;');
    expect(payload.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(payload.html).toContain('O&#039;Neil');
  });

  it('propage une erreur API pour permettre le retry Bull', async () => {
    mocks.send.mockResolvedValue({ data: null, error: { name: 'rate_limit', message: 'slow down' } });
    const service = new MailService(config({ RESEND_API_KEY: 'key' }) as any);
    await expect(service.sendUrgentNotificationEmail('user@example.com', {
      firmName: 'Lex', motifLabel: 'Audience', senderName: 'Admin', timestamp: new Date(),
    })).rejects.toThrow('Resend API error: rate_limit - slow down');
  });

  it('envoie un lien de réinitialisation échappé et contrôle l’erreur API', async () => {
    mocks.send.mockResolvedValueOnce({ data: { id: 'email-2' }, error: null });
    const service = new MailService(config({ RESEND_API_KEY: 'key' }) as any);
    await service.sendPasswordResetEmail('user@example.com', 'https://example.test/reset?a=1&b="x"');
    expect(mocks.send.mock.calls[0][0].html).toContain('a=1&amp;b=&quot;x&quot;');

    mocks.send.mockResolvedValueOnce({ error: { name: 'invalid', message: 'bad sender' } });
    await expect(service.sendPasswordResetEmail('user@example.com', 'https://example.test/reset'))
      .rejects.toThrow('Resend API error: invalid - bad sender');
  });
});
