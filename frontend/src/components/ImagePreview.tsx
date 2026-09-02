// src/components/ImagePreview.tsx
import { FileCheck, Trash2, RefreshCw } from "lucide-react";
import { useLanguage } from "../utils/useLanguage";

interface ImagePreviewProps {
  file: File;
  previewUrl: string;
  onRemove: () => void;
  onChange: () => void;
}

export default function ImagePreview({ file, previewUrl, onRemove, onChange }: ImagePreviewProps) {
  const { t } = useLanguage();
  const fileSizeKB = (file.size / 1024).toFixed(0);

  return (
    <div className="w-full max-w-xl mx-auto bg-gradient-to-b from-white to-[#fbf9f4] rounded-2xl border border-[#CACEB5] p-5 flex flex-col sm:flex-row gap-5 items-center shadow-xs">
      {file.type.startsWith("image/") ? (
        <img
          src={previewUrl}
          alt="Document preview"
          className="w-28 h-28 object-cover rounded-xl border border-[#CACEB5] shadow-sm shrink-0 bg-[#ECE6DA]"
        />
      ) : (
        <div className="w-28 h-28 rounded-xl border border-[#CACEB5] bg-gradient-to-br from-[#ECE6DA] to-[#e4ded0] flex flex-col items-center justify-center text-[#4E6158] shrink-0">
          <FileCheck className="w-10 h-10 mb-1" />
          <span className="text-[10px] font-extrabold tracking-wider uppercase">PDF Doc</span>
        </div>
      )}

      <div className="flex-1 min-w-0 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <FileCheck className="w-4 h-4 text-[#4E6158] shrink-0" />
          <p className="font-extrabold text-[#1F2532] truncate text-sm">{file.name}</p>
        </div>
        <p className="text-xs font-bold text-[#2F3543] mt-1">{fileSizeKB} KB • {t("ready_for_analysis")}</p>

        <div className="flex gap-2.5 mt-4 justify-center sm:justify-start">
          <button
            onClick={onChange}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-lg border border-[#CACEB5] bg-gradient-to-r from-[#ECE6DA] to-[#e4ded0] text-[#1F2532] hover:from-[#e4ded0] hover:to-[#dad4c6] transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t("change_image")}
          </button>
          <button
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-gradient-to-r from-rose-50 to-rose-100/70 hover:from-rose-100 hover:to-rose-200/80 transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("remove_image")}
          </button>
        </div>
      </div>
    </div>
  );
}