import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type TranslationKey } from './en';
import { ar } from './ar';

export type Locale = 'en' | 'ar';
export type Dir = 'ltr' | 'rtl';

const DICTS: Record<Locale, Record<string, string>> = { en, ar };
const STORAGE_KEY = 'evgate.locale';

interface I18nValue {
  locale: Locale;
  dir: Dir;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Picks the localised field of a record that carries `name` / `nameAr`. */
  ln: <T extends { name: string; nameAr?: string }>(record: T | undefined) => string;
  intlLocale: string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'ar' ? 'ar' : 'en';
  });

  const dir: Dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);
  const toggleLocale = useCallback(() => setLocaleState((p) => (p === 'en' ? 'ar' : 'en')), []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let value = DICTS[locale][key] ?? DICTS.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) value = value.replace(`{${k}}`, String(v));
      }
      return value;
    },
    [locale],
  );

  const ln = useCallback(
    <T extends { name: string; nameAr?: string }>(record: T | undefined) => {
      if (!record) return '—';
      return locale === 'ar' && record.nameAr ? record.nameAr : record.name;
    },
    [locale],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, dir, setLocale, toggleLocale, t, ln, intlLocale: locale === 'ar' ? 'ar-AE' : 'en-AE' }),
    [locale, dir, setLocale, toggleLocale, t, ln],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

export type { TranslationKey };
