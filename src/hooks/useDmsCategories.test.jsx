import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DMS_CATEGORIES } from '../config/dms.config';
import { useDmsCategories } from './useDmsCategories';

const mocks = vi.hoisted(() => ({ translations: {} }));

vi.mock('./useTranslation', () => ({
  default: () => ({ t: mocks.translations }),
}));

describe('useDmsCategories', () => {
  it('traduit catégories et sous-catégories avec un repli français', () => {
    mocks.translations = {
      dms_actes_procedures: 'Procedural acts',
      dms_docs_corporate: 'Corporate documents',
      dms_autre: 'Other',
    };
    const { result } = renderHook(() => useDmsCategories());

    expect(result.current).toHaveLength(DMS_CATEGORIES.length + 1);
    expect(result.current[0].label).toBe('Procedural acts');
    expect(result.current.find((item) => item.id === 'documents_clients').subCategories[0].label)
      .toBe('Corporate documents');
    expect(result.current.find((item) => item.id === 'actes_judiciaires').label)
      .toBe('Actes judiciaires');
    expect(result.current.at(-1)).toEqual({ id: 'Autre', label: 'Other', subCategories: [] });
  });
});
