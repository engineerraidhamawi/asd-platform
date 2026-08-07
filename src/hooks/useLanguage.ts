'use client';
import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { translations, type Lang, type TranslationKey } from '@/lib/i18n';

export function useLanguage() {
  const lang = useAppStore(s => s.lang);
  const setLang = useAppStore(s => s.setLang);
  const t = useCallback((key: TranslationKey): string => {
    const l = useAppStore.getState().lang;
    return translations[l]?.[key] ?? key;
  }, []);
  const toggleLang = useCallback(() => setLang(lang === 'ar' ? 'en' : 'ar'), [lang, setLang]);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return { lang, setLang, toggleLang, t, dir };
}