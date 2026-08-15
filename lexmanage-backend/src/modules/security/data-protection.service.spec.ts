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

  it('reste désactivé sans clé et conserve les valeurs en clair', () => {
    delete process.env.DATA_ENCRYPTION_KEY;
    const service = new DataProtectionService();
    expect(service.enabled).toBe(false);
    expect(service.encrypt('plain')).toBe('plain');
    expect(service.encrypt(null)).toBeNull();
    expect(service.encrypt(undefined)).toBeUndefined();
    expect(service.decrypt('plain')).toBe('plain');
    expect(service.searchTokens(['plain'])).toEqual([]);
    expect(() => service.decrypt('enc:v1:a:b:c')).toThrow('DATA_ENCRYPTION_KEY is required');
  });

  it('accepte une clé hexadécimale et refuse les longueurs invalides', () => {
    process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString('hex');
    expect(new DataProtectionService().enabled).toBe(true);
    process.env.DATA_ENCRYPTION_KEY = Buffer.from('too short').toString('base64');
    expect(() => new DataProtectionService()).toThrow('exactly 32 bytes');
  });

  it('ne rechiffre pas un ciphertext et refuse un format incomplet', () => {
    const service = new DataProtectionService();
    const encrypted = service.encrypt('secret') as string;
    expect(service.encrypt(encrypted)).toBe(encrypted);
    expect(() => service.decrypt('enc:v1:missing:parts')).toThrow('Invalid encrypted value');
  });

  it('chiffre, déchiffre et traverse les valeurs JSON imbriquées', () => {
    const service = new DataProtectionService();
    const details = service.encryptJson({ reason: 'confidentiel' });
    const source = service.encryptJson(['document-1']);
    const encryptedName = service.encrypt('Alice');
    const date = new Date('2026-08-15T00:00:00Z');
    const value = {
      name: encryptedName,
      details,
      sources: source,
      nested: [encryptedName, { value: encryptedName }],
      date,
      count: 2,
    };
    expect(service.encryptJson(undefined)).toBeNull();
    expect(service.encryptJson(null)).toBeNull();
    expect(service.decryptJson('plain')).toBe('plain');
    expect(service.deepDecrypt(value)).toEqual({
      name: 'Alice',
      details: { reason: 'confidentiel' },
      sources: ['document-1'],
      nested: ['Alice', { value: 'Alice' }],
      date,
      count: 2,
    });
  });

  it('normalise accents et symboles et gère les mots courts', () => {
    const service = new DataProtectionService();
    expect(service.searchTokens([null, undefined, 'a'])).toEqual([]);
    expect(service.searchTokens(['Été! 42'])).toEqual(service.searchTokens(['ete 42']));
    expect(service.searchTokens(['ab'])).toHaveLength(1);
    expect(new Set(service.searchTokens(['test test'])).size).toBe(service.searchTokens(['test test']).length);
  });

  it('borne les index de recherche à 2000 fragments', () => {
    const service = new DataProtectionService();
    const longUniqueWord = Array.from({ length: 2500 }, (_, index) =>
      index.toString(36).padStart(3, '0'),
    ).join('x');
    expect(service.searchTokens([longUniqueWord])).toHaveLength(2000);
  });
});
