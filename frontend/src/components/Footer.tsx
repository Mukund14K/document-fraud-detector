// src/components/Footer.tsx
import { useLanguage } from "../utils/useLanguage";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-[#CACEB5]/60 bg-gradient-to-r from-[#fbf9f4]/80 via-white to-[#fbf9f4]/80 backdrop-blur-sm py-4 mt-auto">
      <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#2F3543]">
        <p>© {new Date().getFullYear()} {t("footer_rights")}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-extrabold text-[#4E6158]">{t("footer_status")}</span>
        </div>
      </div>
    </footer>
  );
}