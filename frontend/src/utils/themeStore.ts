// src/utils/themeStore.ts
export type ThemeMode = "light" | "dark";
export type LanguageMode = "en" | "hi";

const THEME_KEY = "verifai_theme_mode";
const LANG_KEY = "verifai_language_mode";

type LanguageChangeListener = (lang: LanguageMode) => void;
const languageListeners: Set<LanguageChangeListener> = new Set();

export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved && ["light", "dark"].includes(saved)) {
      return saved;
    }
  } catch (err) {
    console.error("Failed to read theme from storage:", err);
  }
  return "light";
}

export function applyTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch (err) {
    console.error("Failed to save theme to storage:", err);
  }

  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function getStoredLanguage(): LanguageMode {
  try {
    const saved = localStorage.getItem(LANG_KEY) as LanguageMode | null;
    if (saved && ["en", "hi"].includes(saved)) {
      return saved;
    }
  } catch (err) {
    console.error("Failed to read language from storage:", err);
  }
  return "en";
}

export function applyLanguage(lang: LanguageMode): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (err) {
    console.error("Failed to save language to storage:", err);
  }
  languageListeners.forEach((listener) => listener(lang));
}

export function subscribeLanguageChange(listener: LanguageChangeListener): () => void {
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
  };
}
