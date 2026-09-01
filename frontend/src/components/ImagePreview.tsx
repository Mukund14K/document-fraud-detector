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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-5 items-center">
      <img
        src={previewUrl}
        alt="Document preview"
        className="w-32 h-32 object-cover rounded-lg border border-slate-200"
      />
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p className="font-medium text-navy-900 truncate">{file.name}</p>
        <p className="text-sm text-slate-500">{fileSizeKB} KB</p>
        <div className="flex gap-3 mt-3 justify-center sm:justify-start">
          <button
            onClick={onChange}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Change Image
          </button>
          <button
            onClick={onRemove}
            className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}