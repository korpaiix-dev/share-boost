"use client";

import { useState, useRef } from "react";
import { Upload, X, Image, Film } from "lucide-react";

interface MediaUploaderProps {
  onUpload: (files: File[]) => void;
  accept?: string;
}

export default function MediaUploader({ onUpload, accept = "image/*,video/*" }: MediaUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setPreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = () => {
    if (previews.length > 0) {
      onUpload(previews.map((p) => p.file));
      setPreviews([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-indigo-500 bg-indigo-500/5"
            : "border-slate-700 hover:border-slate-600"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="mx-auto text-slate-500 mb-3" size={32} />
        <p className="text-slate-400 text-sm">ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือก</p>
        <p className="text-slate-600 text-xs mt-1">รองรับ JPG, PNG, MP4 (สูงสุด 50MB)</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {previews.map((p, i) => (
            <div key={i} className="relative group">
              <div className="aspect-square bg-slate-800 rounded-xl overflow-hidden">
                {p.file.type.startsWith("video") ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="text-slate-500" size={32} />
                  </div>
                ) : (
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <button
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-white" />
              </button>
              <p className="text-xs text-slate-500 mt-1 truncate">{p.file.name}</p>
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <button
          onClick={handleSubmit}
          className="bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-6 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          <Upload size={16} />
          อัพโหลด {previews.length} ไฟล์
        </button>
      )}
    </div>
  );
}
