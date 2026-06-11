import { useMemo } from 'react';
import { DMS_CATEGORIES } from '../config/dms.config';
import useTranslation from './useTranslation';

/**
 * Returns DMS_CATEGORIES with labels translated to the current UI language.
 * Falls back to the original French label if the key is missing.
 */
export const useDmsCategories = () => {
  const { t } = useTranslation();

  return useMemo(() => [
    ...DMS_CATEGORIES.map(cat => ({
      ...cat,
      label: t[`dms_${cat.id}`] || cat.label,
      subCategories: cat.subCategories.map(sub => ({
        ...sub,
        label: t[`dms_${sub.id}`] || sub.label,
      })),
    })),
    { id: 'Autre', label: t.dms_autre || 'Autre', subCategories: [] },
  ], [t]);
};
