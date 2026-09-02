// src/utils/useLanguage.ts
import { useState, useEffect } from "react";
import { getStoredLanguage, subscribeLanguageChange, type LanguageMode } from "./themeStore";
import { getTranslation, translations } from "./i18n";

export function useLanguage() {
  const [lang, setLang] = useState<LanguageMode>(() => getStoredLanguage());

  useEffect(() => {
    const unsubscribe = subscribeLanguageChange((newLang) => {
      setLang(newLang);
    });
    return unsubscribe;
  }, []);

  function t(key: keyof typeof translations.en): string {
    return getTranslation(key, lang);
  }

  return { lang, t };
}
