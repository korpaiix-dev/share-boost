"use client";

import { useState } from "react";
import { Save, Sparkles, X } from "lucide-react";

interface PostEditorProps {
  postId: number;
  initialCaption: string;
  mediaUrl?: string;
  onSave: (postId: number, caption: string) => void;
  onClose: () => void;
}

export default function PostEditor({ postId, initialCaption, mediaUrl, onSave, onClose }: PostEditorProps) {
  const [caption, setCaption] = useState(initialCaption);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onSave(postId, caption);
    setLoading(false);
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/posts/${postId}/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCaption(data.caption);
      }
    } catch {
      // API not ready
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">แก้ไขแคปชั่น</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {mediaUrl && (
            <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden">
              <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            className="w-full bg-slate-800/60 border border-slate-700 text-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="เขียนแคปชั่น..."
          />

          <div className="flex gap-3">
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={16} />
              AI เขียนใหม่
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
