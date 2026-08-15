import { randomBytes } from 'crypto';
import { DataProtectionService } from './data-protection.service';

describe('DataProtectionService', () => {
  const originalKey = process.env.DATA_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  });

  afterAll(() => {
    if (originalKey === undefined) delete process.env.DATA_ENCRYPTION_KEY;
    else process.env.DATA_ENCRYPTION_KEY = originalKey;
  });

  it('chiffre avec AES-GCM puis restitue le texte original', () => {
    const service = new DataProtectionService();
    const encrypted = service.encrypt('Dossier confidentiel') as string;

    expect(encrypted).toMatch(/^enc:v1:/);
    expect(encrypted).not.toContain('Dossier confidentiel');
    expect(service.decrypt(encrypted)).toBe('Dossier confidentiel');
    expect(service.encrypt('Dossier confidentiel')).not.toBe(encrypted);
  });

  it('refuse un ciphertext altéré', () => {
    const service = new DataProtectionService();
    const encrypted = service.encrypt('secret') as string;
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith('A') ? 'B' : 'A'}`;
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('produit des index de recherche stables sans exposer les mots', () => {
    const service = new DataProtectionService();
    const first = service.searchTokens(['Contrat confidentiel']);
    const second = service.searchTokens(['contrat CONFIDENTIEL']);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
    expect(first.join(' ')).not.toContain('contrat');
  });
});
