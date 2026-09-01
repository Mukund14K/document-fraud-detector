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
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all
        ${isDragging
          ? "border-cyan-400 bg-cyan-50 scale-[1.01]"
          : "border-slate-300 bg-white hover:border-cyan-400 hover:bg-slate-50"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleInputChange}
      />
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
        <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-navy-900">Upload Identity Document</h3>
      <p className="text-slate-500 mt-1 text-sm">
        Upload a passport or visa image for forensic screening.
      </p>
      <p className="text-slate-400 mt-3 text-xs tracking-wide">
        SUPPORTED FORMATS: JPG • JPEG • PNG
      </p>
    </div>
  );
}