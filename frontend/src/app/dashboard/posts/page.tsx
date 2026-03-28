"use client";

import { useState, useEffect } from "react";
import { FileText, Edit2, Clock, CheckCircle, XCircle, Filter } from "lucide-react";
import PostEditor from "@/components/client/PostEditor";
import { apiFetch, formatDate } from "@/lib/api";

interface Post {
  id: number;
  caption: string;
  media_type: string;
  media_url?: string;
  status: string;
  posted_at: string;
  likes: number;
  comments: number;
  shares: number;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await apiFetch<Post[]>("/dashboard/posts");
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (postId: number, caption: string) => {
    try {
      await apiFetch(`/dashboard/posts/${postId}`, {
        method: "PATCH",
        body: JSON.stringify({ caption }),
      });
      setEditingPost(null);
      loadPosts();
    } catch {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const statusIcons: Record<string, React.ReactNode> = {
    posted: <CheckCircle size={14} className="text-emerald-400" />,
    queued: <Clock size={14} className="text-amber-400" />,
    failed: <XCircle size={14} className="text-red-400" />,
  };

  const statusLabels: Record<string, string> = {
    posted: "โพสต์แล้ว",
    queued: "รอโพสต์",
    failed: "ล้มเหลว",
  };

  const filtered = filterStatus ? posts.filter((p) => p.status === filterStatus) : posts;

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">📝 โพสต์ทั้งหมด</h1>
            <p className="text-slate-400 mt-1">{posts.length} โพสต์</p>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">ทั้งหมด</option>
            <option value="posted">โพสต์แล้ว</option>
            <option value="queued">รอโพสต์</option>
            <option value="failed">ล้มเหลว</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <FileText className="mx-auto text-slate-600 mb-3" size={48} />
          <p className="text-slate-400">ยังไม่มีโพสต์</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {statusIcons[post.status]}
                    <span className="text-xs text-slate-400">{statusLabels[post.status] || post.status}</span>
                    <span className="text-xs text-slate-500">{formatDate(post.posted_at)}</span>
                    {post.media_type && (
                      <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{post.media_type}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 line-clamp-3">{post.caption}</p>
                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                    <span>🔄 {post.shares}</span>
                  </div>
                </div>
                {post.status === "queued" && (
                  <button
                    onClick={() => setEditingPost(post)}
                    className="ml-4 p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingPost && (
        <PostEditor
          postId={editingPost.id}
          initialCaption={editingPost.caption}
          mediaUrl={editingPost.media_url}
          onSave={handleSave}
          onClose={() => setEditingPost(null)}
        />
      )}
    </div>
  );
}
