// src/components/UploadZone.tsx
import { useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onError: (message: string) => void;
}

export default function UploadZone({ onFileSelected, onError }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function validateAndEmit(file: File | undefined | null) {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError("Please upload a JPG, JPEG, or PNG image.");
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
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300
        ${isDragging
          ? "border-[#9a8265] bg-[#e0d4bf]/30 scale-[1.01] shadow-md"
          : "border-[#c5b293]/60 bg-white/80 backdrop-blur-sm hover:border-[#9a8265] hover:bg-[#f6f1e6]/60 shadow-[0_8px_30px_rgba(108,90,70,0.06)] hover:shadow-[0_12px_35px_rgba(108,90,70,0.12)]"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleInputChange}
      />
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gradient-to-br from-[#f6f1e6] to-[#e0d4bf] border border-[#c5b293]/40 flex items-center justify-center shadow-inner">
        <svg className="w-7 h-7 text-[#6c5a46]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#6c5a46]">Upload Identity Document</h3>
      <p className="text-[#9a8265] mt-1 text-sm">
        Upload a passport or visa image for forensic screening.
      </p>
      <p className="text-[#9a8265]/80 mt-3 text-xs tracking-wide font-medium">
        SUPPORTED FORMATS: JPG • JPEG • PNG
      </p>
    </div>
  );
}