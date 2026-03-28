"use client";

import { useState, useEffect } from "react";
import { Image, Film, Trash2, Download } from "lucide-react";
import MediaUploader from "@/components/client/MediaUploader";
import { apiFetch, formatDate } from "@/lib/api";

interface MediaItem {
  id: number;
  filename: string;
  type: string;
  url: string;
  size: number;
  created_at: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const data = await apiFetch<MediaItem[]>("/dashboard/media");
      setMedia(data);
    } catch {
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const token = localStorage.getItem("token");
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/dashboard/media/upload`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          }
        );
      } catch {
        // upload failed
      }
    }
    loadMedia();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ต้องการลบไฟล์นี้?")) return;
    try {
      await apiFetch(`/dashboard/media/${id}`, { method: "DELETE" });
      loadMedia();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white tracking-tight">🖼️ คลังสื่อ</h1>
        <p className="text-slate-400 mt-1">รูปภาพและวิดีโอ ({media.length} ไฟล์)</p>
      </header>

      <MediaUploader onUpload={handleUpload} />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Image className="mx-auto text-slate-600 mb-3" size={48} />
          <p className="text-slate-400">ยังไม่มีไฟล์ในคลังสื่อ</p>
          <p className="text-slate-500 text-sm mt-1">อัพโหลดรูปภาพหรือวิดีโอเพื่อใช้โพสต์</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map((item) => (
            <div key={item.id} className="group relative">
              <div className="aspect-square bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {item.type.startsWith("video") ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <Film className="text-slate-500" size={32} />
                  </div>
                ) : (
                  <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                )}
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-8 h-8 bg-red-500/80 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  <Trash2 size={14} className="text-white" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">{item.filename}</p>
              <p className="text-xs text-slate-600">{formatSize(item.size)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
