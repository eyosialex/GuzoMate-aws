import en from '../locales/en.json';
import am from '../locales/am.json';
import om from '../locales/om.json';
import { Language } from '../types';

export const translations: Record<Language, typeof en> = {
  en,
  am,
  om,
};

export function getTranslation(lang: Language, path: string, params?: Record<string, string | number>): string {
  const keys = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = translations[lang] || translations.en;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      // Fallback to English if missing in target language
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fallback: any = translations.en;
      for (const fKey of keys) {
        if (fallback && typeof fallback === 'object' && fKey in fallback) {
          fallback = fallback[fKey];
        } else {
          return path;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  let text = current;
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
    }
  }

  return text;
}
