import { useMemo } from 'react';
import useLexStore from '../store/useLexStore';
import { translations } from '../utils/translations';

/**
 * Reactive translation hook.
 * Returns `t` — a proxy object keyed on the current language.
 * Any component that calls this hook will re-render automatically
 * when the user switches language in Settings.
 */
const useTranslation = () => {
  const language = useLexStore((state) => state.language);
  const t = useMemo(
    () => translations[language] || translations.en,
    [language],
  );
  return { t, language };
};

export default useTranslation;
