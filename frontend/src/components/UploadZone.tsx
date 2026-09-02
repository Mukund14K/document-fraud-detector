// src/components/UploadZone.tsx
import { useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { useLanguage } from "../utils/useLanguage";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onError: (message: string) => void;
}

export default function UploadZone({ onFileSelected, onError }: UploadZoneProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function validateAndEmit(file: File | undefined | null) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      onError("File size exceeds 20 MB limit.");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      onError("Please upload a JPG, PNG, or PDF file.");
      return;
    }
    onFileSelected(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndEmit(file);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    validateAndEmit(file);
    e.target.value = "";
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Dashed Upload Box */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`w-full max-w-xl cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-12 text-center shadow-xs hover:shadow-md ${
          isDragging
            ? "border-[#4E6158] bg-gradient-to-b from-[#ECE6DA]/50 to-[#e4ded0]/60 scale-[1.005]"
            : "border-[#CACEB5] hover:border-[#4E6158] bg-gradient-to-b from-white via-[#fefdfb] to-[#f6f2ea]/70"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Upload Icon Badge */}
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ECE6DA] via-[#f0eae0] to-[#e4dccb] border border-[#CACEB5] flex items-center justify-center shadow-sm">
          <Upload className="w-6 h-6 text-[#4E6158]" />
        </div>

        {/* Drag & Drop text */}
        <h3 className="text-base font-black text-[#1F2532]">
          {t("upload_drag_drop")}
        </h3>
        <p className="text-sm font-bold text-[#2F3543] mt-1">
          <span className="text-[#4E6158] hover:underline font-extrabold">
            {t("upload_browse")}
          </span>
        </p>
      </div>

      {/* Supported formats text */}
      <p className="text-xs font-bold text-[#2F3543] mt-5">
        {t("upload_supported")}
      </p>
    </div>
  );
}