// src/components/ImagePreview.tsx
interface ImagePreviewProps {
  file: File;
  previewUrl: string;
  onRemove: () => void;
  onChange: () => void;
}

export default function ImagePreview({ file, previewUrl, onRemove, onChange }: ImagePreviewProps) {
  const fileSizeKB = (file.size / 1024).toFixed(0);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#c5b293]/40 p-5 flex flex-col sm:flex-row gap-5 items-center shadow-[0_8px_30px_rgba(108,90,70,0.07)]">
      <img
        src={previewUrl}
        alt="Document preview"
        className="w-32 h-32 object-cover rounded-lg border border-[#c5b293]/40 shadow-sm"
      />
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p className="font-semibold text-[#6c5a46] truncate">{file.name}</p>
        <p className="text-sm text-[#9a8265] mt-0.5">{fileSizeKB} KB</p>
        <div className="flex gap-3 mt-4 justify-center sm:justify-start">
          <button
            onClick={onChange}
            className="text-sm px-3.5 py-1.5 rounded-lg border border-[#c5b293]/60 bg-[#f6f1e6]/60 text-[#6c5a46] hover:bg-[#e0d4bf]/60 transition-all duration-200 shadow-sm hover:-translate-y-0.5"
          >
            Change Image
          </button>
          <button
            onClick={onRemove}
            className="text-sm px-3.5 py-1.5 rounded-lg border border-[#c5b293]/50 text-[#8c4a40] bg-[#fdf2f0] hover:bg-[#f9e4e1] transition-all duration-200 shadow-sm hover:-translate-y-0.5"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}