// src/components/SettingsDropdown.tsx
import { useState, useEffect, useRef } from "react";
import {
  getStoredTheme,
  applyTheme,
  applyLanguage,
  type ThemeMode,
  type LanguageMode
} from "../utils/themeStore";
import { useLanguage } from "../utils/useLanguage";
import {
  Sun,
  Moon,
  Globe,
  Settings,
  ShieldCheck
} from "lucide-react";

export default function SettingsDropdown() {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentTheme = getStoredTheme();
    setThemeMode(currentTheme);
    applyTheme(currentTheme);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleThemeChange(newTheme: ThemeMode) {
    setThemeMode(newTheme);
    applyTheme(newTheme);
  }

  function handleLanguageChange(newLang: LanguageMode) {
    applyLanguage(newLang);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={t("settings_title")}
        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? "bg-[#ECE6DA] border-[#4E6158] text-[#1F2532]"
            : "text-[#2F3543] hover:text-[#1F2532] hover:bg-[#ECE6DA]/60 border-transparent"
        }`}
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* FLOATING DROPDOWN CARD */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gradient-to-b from-white via-[#fefdfb] to-[#f8f5ee] border border-[#CACEB5] rounded-2xl shadow-xl z-50 p-4 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-[#CACEB5]/70">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1F2532]">
              {t("settings_title")}
            </h3>
            <span className="text-[10px] font-extrabold text-[#4E6158] bg-[#ECE6DA] px-2 py-0.5 rounded-full border border-[#CACEB5]">
              v2.4
            </span>
          </div>

          {/* SECTION 1: APPEARANCE (Light / Dark) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-[#1F2532]">
              <span>{t("appearance")}</span>
              <span className="text-[11px] capitalize font-bold text-[#4E6158]">
                {themeMode === "light" ? t("light_mode") : t("dark_mode")} {t("mode_suffix")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[#ECE6DA]/70 border border-[#CACEB5]/80 rounded-xl">
              {/* Light */}
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  themeMode === "light"
                    ? "bg-white text-[#1F2532] shadow-xs border border-[#CACEB5]"
                    : "text-[#2F3543] hover:text-[#1F2532]"
                }`}
              >
                <Sun className="w-4 h-4 text-amber-600" />
                <span>{t("light_mode")}</span>
              </button>

              {/* Dark */}
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  themeMode === "dark"
                    ? "bg-[#1F2532] text-white shadow-xs border border-[#2a3649]"
                    : "text-[#2F3543] hover:text-[#1F2532]"
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>{t("dark_mode")}</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: LANGUAGE - RESTRICTED TO English AND हिंदी (Hindi) ONLY */}
          <div className="space-y-2 pt-2 border-t border-[#CACEB5]/60">
            <div className="flex items-center justify-between text-xs font-black text-[#1F2532]">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#4E6158]" />
                <span>{t("language")}</span>
              </span>
            </div>

            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value as LanguageMode)}
              className="w-full bg-white border border-[#CACEB5] rounded-xl px-3 py-2 text-xs font-black text-[#1F2532] focus:outline-none focus:border-[#4E6158] cursor-pointer shadow-inner"
            >
              <option value="en">{t("lang_en")}</option>
              <option value="hi">{t("lang_hi")}</option>
            </select>
          </div>

          {/* FOOTER BADGE */}
          <div className="pt-2 border-t border-[#CACEB5]/60 flex items-center gap-2 text-[11px] font-bold text-[#4E6158]">
            <ShieldCheck className="w-4 h-4 text-[#4E6158] shrink-0" />
            <span>{t("zero_retention_badge")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
