import { ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';

export type EnvironmentConfig = Record<string, unknown>;

export const validateEnvironment = (config: EnvironmentConfig) => {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'ALLOWED_ORIGINS'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

  const production = config.NODE_ENV === 'production';
  if (production) {
    const requiredInProduction = ['REDIS_HOST', 'S3_ENDPOINT', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET', 'FRONTEND_URL'];
    const productionMissing = requiredInProduction.filter((key) => !config[key]);
    if (productionMissing.length) throw new Error(`Missing production environment variables: ${productionMissing.join(', ')}`);
    if (String(config.ALLOWED_ORIGINS).split(',').some((origin) => origin.trim().includes('localhost'))) {
      throw new Error('ALLOWED_ORIGINS must not contain localhost in production');
    }
    if (config.REDIS_HOST === 'localhost') throw new Error('REDIS_HOST must not be localhost in production');
    if (!['AES256', 'aws:kms'].includes(String(config.S3_SERVER_SIDE_ENCRYPTION))) {
      throw new Error('S3_SERVER_SIDE_ENCRYPTION must be AES256 or aws:kms in production');
    }
    if (config.S3_SERVER_SIDE_ENCRYPTION === 'aws:kms' && !config.S3_KMS_KEY_ID) {
      throw new Error('S3_KMS_KEY_ID is required when using aws:kms encryption');
    }
  }

  if (String(config.JWT_SECRET).length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  if (production && /change[_-]?me|replace[_-]?me/i.test(String(config.JWT_SECRET))) {
    throw new Error('JWT_SECRET still contains a placeholder value');
  }
  if (config.N8N_WEBHOOK_SECRET && String(config.N8N_WEBHOOK_SECRET).length < 32) {
    throw new Error('N8N_WEBHOOK_SECRET must contain at least 32 characters');
  }
  if (production && !config.DATA_ENCRYPTION_KEY) throw new Error('DATA_ENCRYPTION_KEY is required in production');

  const retentionDays = Number(config.AUDIT_RETENTION_DAYS || 730);
  if (!Number.isInteger(retentionDays) || retentionDays < 90 || retentionDays > 3650) {
    throw new Error('AUDIT_RETENTION_DAYS must be an integer between 90 and 3650');
  }
  const malwareMode = String(config.MALWARE_SCAN_MODE || (production ? 'required' : 'disabled')).toLowerCase();
  if (!['required', 'optional', 'disabled'].includes(malwareMode)) {
    throw new Error('MALWARE_SCAN_MODE must be required, optional or disabled');
  }
  if (production && malwareMode !== 'required') throw new Error('MALWARE_SCAN_MODE must be required in production');
  if (malwareMode === 'required' && !config.CLAMAV_HOST) {
    throw new Error('CLAMAV_HOST is required when malware scanning is required');
  }
  if (production && config.PUBLIC_API_URL && !String(config.PUBLIC_API_URL).startsWith('https://')) {
    throw new Error('PUBLIC_API_URL must use HTTPS in production');
  }
  if ((config.N8N_RAG_CHAT_URL || config.N8N_RAG_INGEST_URL || config.N8N_RAG_DELETE_URL) && !config.N8N_WEBHOOK_SECRET) {
    throw new Error('N8N_WEBHOOK_SECRET is required when n8n integration is enabled');
  }
  return config;
};

export const createCacheOptions = (config: ConfigService) => {
  const protocol = config.get('REDIS_TLS') === 'true' ? 'rediss' : 'redis';
  const redisPassword = config.get<string>('REDIS_PASSWORD');
  const password = redisPassword ? `:${encodeURIComponent(redisPassword)}@` : '';
  const url = config.get<string>('REDIS_URL') ||
    `${protocol}://${password}${config.get('REDIS_HOST') || 'localhost'}:${config.get('REDIS_PORT') || '6379'}`;
  return { stores: [new KeyvRedis(url)], ttl: 300000 };
};

export const createBullOptions = (config: ConfigService) => ({
  redis: {
    host: config.get('REDIS_HOST') || 'localhost',
    port: Number(config.get('REDIS_PORT') || 6379),
    ...(config.get('REDIS_PASSWORD') ? { password: config.get('REDIS_PASSWORD') } : {}),
    ...(config.get('REDIS_TLS') === 'true' ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
});
