import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'crypto';

const PREFIX = 'enc:v1:';

@Injectable()
export class DataProtectionService {
  private readonly key?: Buffer;
  private readonly indexKey?: Buffer;

  constructor() {
    const raw = process.env.DATA_ENCRYPTION_KEY?.trim();
    if (!raw) return;
    const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      throw new Error('DATA_ENCRYPTION_KEY must decode to exactly 32 bytes');
    }
    this.key = key;
    this.indexKey = createHmac('sha256', key).update('lexmanage-blind-index-v1').digest();
  }

  get enabled() {
    return Boolean(this.key);
  }

  encrypt(value: string | null | undefined): string | null | undefined {
    if (!value || !this.key || value.startsWith(PREFIX)) return value;
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, nonce);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${PREFIX}${nonce.toString('base64url')}:${tag.toString('base64url')}:${ciphertext.toString('base64url')}`;
  }

  decrypt(value: string | null | undefined): string | null | undefined {
    if (!value || !value.startsWith(PREFIX)) return value;
    if (!this.key) throw new Error('DATA_ENCRYPTION_KEY is required to read encrypted data');
    const [nonceValue, tagValue, ciphertextValue] = value.slice(PREFIX.length).split(':');
    if (!nonceValue || !tagValue || !ciphertextValue) throw new Error('Invalid encrypted value');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(nonceValue, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  encryptJson(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    return this.encrypt(JSON.stringify(value)) as string;
  }

  decryptJson(value: unknown): unknown {
    if (typeof value !== 'string' || !value.startsWith(PREFIX)) return value;
    return JSON.parse(this.decrypt(value) as string);
  }

  deepDecrypt<T>(value: T): T {
    if (typeof value === 'string') return this.decrypt(value) as T;
    if (Array.isArray(value)) return value.map((item) => this.deepDecrypt(item)) as T;
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [
          key,
          key === 'details' || key === 'sources'
            ? this.decryptJson(item)
            : this.deepDecrypt(item),
        ]),
      ) as T;
    }
    return value;
  }

  searchTokens(values: Array<string | null | undefined>): string[] {
    if (!this.indexKey) return [];
    const plainTokens = new Set<string>();
    for (const value of values) {
      const normalized = this.normalize(value || '').slice(0, 5000);
      for (const word of normalized.split(/\s+/).filter(Boolean)) {
        const symbols = Array.from(word);
        if (symbols.length < 2) continue;
        const width = symbols.length === 2 ? 2 : 3;
        for (let index = 0; index <= symbols.length - width; index += 1) {
          plainTokens.add(symbols.slice(index, index + width).join(''));
          if (plainTokens.size >= 2000) break;
        }
        if (plainTokens.size >= 2000) break;
      }
    }
    return [...plainTokens].map((token) =>
      createHmac('sha256', this.indexKey!).update(token).digest('base64url').slice(0, 22),
    );
  }

  private normalize(value: string) {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }
}
