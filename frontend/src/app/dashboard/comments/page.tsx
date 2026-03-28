"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Bot, User, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/api";

interface Comment {
  id: number;
  commenter_name: string;
  comment_text: string;
  reply_text: string | null;
  replied_at: string | null;
  post_caption: string;
  created_at: string;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setComments([
      { id: 1, commenter_name: "สมชาย", comment_text: "สวยมากเลยค่ะ", reply_text: "ขอบคุณมากค่ะ 💕 กดลิงก์ที่โปรไฟล์ได้เลยนะคะ", replied_at: "2026-03-28T06:15:00", post_caption: "วันนี้มีโปรพิเศษค่ะ!", created_at: "2026-03-28T06:00:00" },
      { id: 2, commenter_name: "น้องแนน", comment_text: "ราคาเท่าไหร่คะ", reply_text: "สินค้าชิ้นนี้ 590 บาทค่ะ ทักแชทมาได้เลยนะคะ 😊", replied_at: "2026-03-28T05:30:00", post_caption: "สินค้ามาใหม่เข้ามาดู", created_at: "2026-03-28T05:00:00" },
      { id: 3, commenter_name: "พี่เจ", comment_text: "มีไซส์ XL ไหมครับ", reply_text: "มีค่ะ! XL สีดำ สีขาว สีน้ำเงิน พร้อมส่งเลยค่ะ", replied_at: "2026-03-27T20:00:00", post_caption: "คอลเลคชั่นหน้าฝน", created_at: "2026-03-27T19:30:00" },
      { id: 4, commenter_name: "คุณมด", comment_text: "ส่งไวไหมคะ", reply_text: "ส่งภายใน 1-2 วันทำการค่ะ ใช้ Kerry + Flash Express 🚀", replied_at: "2026-03-27T18:45:00", post_caption: "โปรโมชั่นส่งฟรี", created_at: "2026-03-27T18:00:00" },
    ]);
    setLoading(false);
  }, []);

  const loadComments = () => {
    // Mock reload
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">💬 คอมเม้นท์</h1>
            <p className="text-slate-400 mt-1">{comments.length} ความคิดเห็น</p>
          </div>
          <button
            onClick={() => { setLoading(true); loadComments(); }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition-colors"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-32 mb-3" />
              <div className="h-3 bg-slate-800 rounded w-full mb-2" />
              <div className="h-3 bg-slate-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <MessageCircle className="mx-auto text-slate-600 mb-3" size={48} />
          <p className="text-slate-400">ยังไม่มีคอมเม้นท์</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-slate-700 transition-all">
              {/* Post reference */}
              <p className="text-xs text-slate-500 mb-3 line-clamp-1">โพสต์: {comment.post_caption}</p>

              {/* Comment */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <User size={14} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{comment.commenter_name}</span>
                    <span className="text-xs text-slate-500">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{comment.comment_text}</p>
                </div>
              </div>

              {/* AI Reply */}
              {comment.reply_text && (
                <div className="flex gap-3 mt-3 ml-11">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-indigo-400">AI ตอบ</span>
                      {comment.replied_at && <span className="text-xs text-slate-500">{formatDate(comment.replied_at)}</span>}
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{comment.reply_text}</p>
                  </div>
                </div>
              )}

              {!comment.reply_text && (
                <div className="ml-11 mt-3">
                  <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg">รอ AI ตอบ</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
