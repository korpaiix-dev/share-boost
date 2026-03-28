"use client";

import { useState, useEffect } from "react";
import { Globe, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PageData {
  id: number;
  customer_name: string;
  page_name: string;
  fb_page_id: string;
  caption_style: string;
  auto_post: boolean;
  auto_comment: boolean;
  auto_chat: boolean;
  status: string;
  post_times: string[];
  posts_count: number;
}

export default function PagesPage() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const data = await apiFetch<PageData[]>("/admin/pages");
      setPages(data);
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePageStatus = async (id: number, currentStatus: string) => {
    try {
      await apiFetch(`/admin/pages/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: currentStatus === "active" ? "paused" : "active" }),
      });
      loadPages();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const styleLabels: Record<string, string> = {
    sexy: "🔥 เซ็กซี่", cute: "🌸 น่ารัก", funny: "😂 ตลก", sell: "💰 ขายของ", classy: "✨ หรูหรา",
  };

  const filtered = pages.filter((p) => p.page_name.includes(search) || p.customer_name.includes(search));

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white tracking-tight">📄 เพจทั้งหมด</h1>
        <p className="text-slate-400 mt-1">{pages.length} เพจ</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
          placeholder="ค้นหาชื่อเพจ, ลูกค้า..."
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((page) => (
            <div key={page.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Globe className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{page.page_name}</h3>
                    <p className="text-sm text-slate-400">ลูกค้า: {page.customer_name}</p>
                    <p className="text-xs text-slate-500 mt-1">FB ID: {page.fb_page_id} | โพสต์: {page.posts_count} | สไตล์: {styleLabels[page.caption_style] || page.caption_style}</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePageStatus(page.id, page.status)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    page.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {page.status === "active" ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {page.status === "active" ? "เปิดใช้" : "หยุด"}
                </button>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                <span>เวลาโพสต์: {page.post_times?.join(", ") || "-"}</span>
                <span className={page.auto_post ? "text-emerald-400" : ""}>โพสต์: {page.auto_post ? "อัตโนมัติ" : "ปิด"}</span>
                <span className={page.auto_comment ? "text-emerald-400" : ""}>คอมเม้น: {page.auto_comment ? "อัตโนมัติ" : "ปิด"}</span>
                <span className={page.auto_chat ? "text-emerald-400" : ""}>แชท: {page.auto_chat ? "อัตโนมัติ" : "ปิด"}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-slate-500 py-8">ไม่พบเพจ</p>}
        </div>
      )}
    </div>
  );
}
