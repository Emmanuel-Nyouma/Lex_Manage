import { describe, expect, it } from 'vitest';
import { formatLegalDate, parseLegalDate } from './dateOnly';

describe('dates juridiques sans fuseau horaire', () => {
  it('conserve le jour civil fourni par l’API', () => {
    const parsed = parseLegalDate('2026-07-26');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(26);
  });

  it('ignore la composante UTC pour une échéance date-only', () => {
    const parsed = parseLegalDate('2026-07-26T00:00:00.000Z');
    expect(parsed.getDate()).toBe(26);
  });

  it('formate la date en français', () => {
    expect(formatLegalDate('2026-07-26', 'fr-FR')).toBe('26/07/2026');
  });
});
