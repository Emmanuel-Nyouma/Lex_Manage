import { beforeEach, describe, expect, it, vi } from 'vitest';

const RedisStoreMock = vi.hoisted(() => class RedisStoreMock {
  constructor(public readonly url: string) {}
});
vi.mock('@keyv/redis', () => ({ default: RedisStoreMock }));

import { createBullOptions, createCacheOptions, validateEnvironment } from './app.config';

const base = {
  DATABASE_URL: 'postgres://database',
  JWT_SECRET: 'a-secure-jwt-secret-with-32-characters',
  ALLOWED_ORIGINS: 'https://lex.test',
};

const production = {
  ...base,
  NODE_ENV: 'production',
  REDIS_HOST: 'redis.internal',
  S3_ENDPOINT: 'storage.internal',
  S3_ACCESS_KEY: 'access',
  S3_SECRET_KEY: 'secret',
  S3_BUCKET: 'documents',
  FRONTEND_URL: 'https://lex.test',
  S3_SERVER_SIDE_ENCRYPTION: 'AES256',
  DATA_ENCRYPTION_KEY: 'encryption-key',
  MALWARE_SCAN_MODE: 'required',
  CLAMAV_HOST: 'clamav.internal',
};

const configService = (values: Record<string, unknown>) => ({
  get: vi.fn((key: string) => values[key]),
}) as any;

describe('application configuration', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepte les configurations valides de développement et production', () => {
    expect(validateEnvironment({ ...base })).toEqual(base);
    expect(validateEnvironment({ ...production })).toEqual(production);
    expect(validateEnvironment({ ...production, S3_SERVER_SIDE_ENCRYPTION: 'aws:kms', S3_KMS_KEY_ID: 'kms-key' }))
      .toEqual(expect.objectContaining({ S3_KMS_KEY_ID: 'kms-key' }));
    expect(validateEnvironment({ ...production, MALWARE_SCAN_MODE: undefined }))
      .toEqual(expect.objectContaining({ NODE_ENV: 'production' }));
  });

  it.each([
    [{}, 'Missing required environment variables'],
    [{ ...base, NODE_ENV: 'production' }, 'Missing production environment variables'],
    [{ ...production, ALLOWED_ORIGINS: 'https://lex.test, http://localhost:5173' }, 'must not contain localhost'],
    [{ ...production, REDIS_HOST: 'localhost' }, 'REDIS_HOST must not be localhost'],
    [{ ...production, S3_SERVER_SIDE_ENCRYPTION: 'none' }, 'must be AES256 or aws:kms'],
    [{ ...production, S3_SERVER_SIDE_ENCRYPTION: 'aws:kms' }, 'S3_KMS_KEY_ID is required'],
    [{ ...base, JWT_SECRET: 'short' }, 'at least 32 characters'],
    [{ ...production, JWT_SECRET: 'change-me-change-me-change-me-change-me' }, 'placeholder value'],
    [{ ...base, N8N_WEBHOOK_SECRET: 'short' }, 'N8N_WEBHOOK_SECRET must contain'],
    [{ ...production, DATA_ENCRYPTION_KEY: undefined }, 'DATA_ENCRYPTION_KEY is required'],
    [{ ...base, AUDIT_RETENTION_DAYS: '89' }, 'AUDIT_RETENTION_DAYS'],
    [{ ...base, AUDIT_RETENTION_DAYS: '3651' }, 'AUDIT_RETENTION_DAYS'],
    [{ ...base, AUDIT_RETENTION_DAYS: '90.5' }, 'AUDIT_RETENTION_DAYS'],
    [{ ...base, MALWARE_SCAN_MODE: 'sometimes' }, 'MALWARE_SCAN_MODE must be required, optional or disabled'],
    [{ ...production, MALWARE_SCAN_MODE: 'optional' }, 'MALWARE_SCAN_MODE must be required in production'],
    [{ ...base, MALWARE_SCAN_MODE: 'required' }, 'CLAMAV_HOST is required'],
    [{ ...production, PUBLIC_API_URL: 'http://api.test' }, 'PUBLIC_API_URL must use HTTPS'],
    [{ ...base, N8N_RAG_CHAT_URL: 'https://n8n.test/chat' }, 'N8N_WEBHOOK_SECRET is required'],
    [{ ...base, N8N_RAG_INGEST_URL: 'https://n8n.test/ingest' }, 'N8N_WEBHOOK_SECRET is required'],
    [{ ...base, N8N_RAG_DELETE_URL: 'https://n8n.test/delete' }, 'N8N_WEBHOOK_SECRET is required'],
  ])('rejette chaque configuration non sûre', (configuration, message) => {
    expect(() => validateEnvironment(configuration)).toThrow(message);
  });

  it('construit les URL Redis par défaut, TLS, mot de passe et URL explicite', () => {
    expect(createCacheOptions(configService({}))).toEqual({ stores: [{ url: 'redis://localhost:6379' }], ttl: 300000 });
    expect(createCacheOptions(configService({ REDIS_TLS: 'true', REDIS_HOST: 'redis', REDIS_PORT: '6380', REDIS_PASSWORD: 'p@ss' })))
      .toEqual({ stores: [{ url: 'rediss://:p%40ss@redis:6380' }], ttl: 300000 });
    expect(createCacheOptions(configService({ REDIS_URL: 'redis://explicit:6379' })))
      .toEqual({ stores: [{ url: 'redis://explicit:6379' }], ttl: 300000 });
  });

  it('construit les options Bull avec valeurs par défaut et options sécurisées', () => {
    expect(createBullOptions(configService({}))).toEqual({
      redis: { host: 'localhost', port: 6379, maxRetriesPerRequest: null, enableReadyCheck: false },
    });
    expect(createBullOptions(configService({ REDIS_HOST: 'redis', REDIS_PORT: '6380', REDIS_PASSWORD: 'secret', REDIS_TLS: 'true' })))
      .toEqual({
        redis: { host: 'redis', port: 6380, password: 'secret', tls: {}, maxRetriesPerRequest: null, enableReadyCheck: false },
      });
  });
});
