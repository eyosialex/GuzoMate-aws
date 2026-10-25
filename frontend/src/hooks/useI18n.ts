import { useCallback } from 'react';
import { useAppStore } from '../features/useAppStore';
import { getTranslation } from '../lib/i18n';

export function useI18n() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      return getTranslation(language, path, params);
    },
    [language]
  );

  return { t, language, setLanguage };
}
