import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureFrontendError, initErrorTracking, redactSensitiveText, sanitizeSentryEvent } from './errorTracking';
import * as Sentry from '@sentry/react';

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  withScope: vi.fn(),
  captureException: vi.fn(),
}));

describe('frontend error tracking', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it('reste désactivé lorsqu’aucun DSN n’est configuré', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    expect(initErrorTracking()).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('masque les données sensibles des messages et événements', () => {
    expect(redactSensitiveText('alice@example.test token=abc 123e4567-e89b-12d3-a456-426614174000'))
      .toBe('[REDACTED_EMAIL] token=[REDACTED] [REDACTED_ID]');
    const sanitized = sanitizeSentryEvent({
      message: 'Failure for alice@example.test',
      user: { email: 'alice@example.test' },
      extra: { payload: 'legal document' },
      request: { method: 'POST', url: 'https://lex.example/clients/123e4567-e89b-12d3-a456-426614174000?token=secret', data: 'private' },
      exception: { values: [{ type: 'Error', value: 'password=hunter2' }] },
    });

    expect(sanitized.message).toBe('Failure for [REDACTED_EMAIL]');
    expect(sanitized.user).toBeUndefined();
    expect(sanitized.extra).toBeUndefined();
    expect(sanitized.request).toEqual({ method: 'POST', url: 'https://lex.example/clients/[REDACTED_ID]' });
    expect(sanitized.exception.values[0].value).toBe('password=[REDACTED]');
  });

  it('initialise Sentry avec une collecte minimale et capture l’erreur React', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.ingest.sentry.io/1');
    expect(initErrorTracking()).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      dsn: 'https://public@example.ingest.sentry.io/1',
      sendDefaultPii: false,
      tracesSampleRate: 0,
      beforeSend: sanitizeSentryEvent,
    }));

    const scope = { setTag: vi.fn(), setContext: vi.fn() };
    Sentry.withScope.mockImplementation((callback) => callback(scope));
    const error = new Error('Render failed');
    captureFrontendError(error, { source: 'boundary', componentStack: 'at Client alice@example.test' });

    expect(scope.setTag).toHaveBeenCalledWith('source', 'boundary');
    expect(scope.setContext).toHaveBeenCalledWith('react', { componentStack: 'at Client [REDACTED_EMAIL]' });
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
