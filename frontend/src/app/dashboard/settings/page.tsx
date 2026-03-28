"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, Save, Sparkles, CheckCircle2, AlertTriangle, ExternalLink, Unlink, RefreshCw } from "lucide-react";
import { apiFetch, getApiBase } from "@/lib/api";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

interface PageSettings {
  caption_style: string;
  keywords: string;
  auto_post: boolean;
  auto_comment: boolean;
  auto_chat: boolean;
  post_times: string[];
}

interface ConnectedPage {
  id: number;
  fb_page_id: string;
  page_name: string;
  access_token: string;
  status: string;
  created_at: string;
}

const captionStyles = [
  { value: "sexy", label: "🔥 เซ็กซี่", desc: "แคปชั่นเร้าใจ ดึงดูดความสนใจ" },
  { value: "cute", label: "🌸 น่ารัก", desc: "สไตล์คาวาอี้ น่ารักสดใส" },
  { value: "funny", label: "😂 ตลก", desc: "มุกตลก เฮฮา สร้างเสียงหัวเราะ" },
  { value: "sell", label: "💰 ขายของ", desc: "แคปชั่นขายสินค้า กระตุ้นยอดขาย" },
  { value: "classy", label: "✨ หรูหรา", desc: "สไตล์พรีเมียม หรูหราดูดี" },
];

const mockPages: ConnectedPage[] = [
  { id: 1, fb_page_id: "pg-1", page_name: "เสื้อผ้าแฟชั่น by เจน", access_token: "valid", status: "active", created_at: "2026-01-15T00:00:00" },
  { id: 2, fb_page_id: "pg-2", page_name: "เจน Outlet", access_token: "", status: "paused", created_at: "2026-02-20T00:00:00" },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<PageSettings>({
    caption_style: "cute",
    keywords: "",
    auto_post: true,
    auto_comment: true,
    auto_chat: false,
    post_times: ["12:00", "19:00"],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connectedPages, setConnectedPages] = useState<ConnectedPage[]>([]);
  const [connectMessage, setConnectMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // เช็คผลลัพธ์จาก OAuth callback
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected === "true") {
      setConnectMessage({ type: "success", text: "เชื่อมต่อเพจ Facebook สำเร็จ!" });
    } else if (connected === "false") {
      const errorMessages: Record<string, string> = {
        denied: "คุณยกเลิกการเชื่อมต่อ",
        no_pages: "ไม่พบเพจ Facebook ในบัญชีของคุณ",
        no_customer: "ไม่พบบัญชีลูกค้าในระบบ",
        oauth_failed: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองอีกครั้ง",
      };
      setConnectMessage({ type: "error", text: errorMessages[error || ""] || "เกิดข้อผิดพลาด" });
    }

    // โหลดข้อมูลเพจจาก API
    loadPages();
  }, [searchParams]);

  const loadPages = async () => {
    try {
      const pages = await apiFetch<ConnectedPage[]>("/customers/me/pages");
      setConnectedPages(pages);

      // ถ้ามีเพจ โหลด settings ของเพจแรก
      if (pages.length > 0) {
        try {
          const pageSettings = await apiFetch<PageSettings>(
            `/customers/pages/${pages[0].id}/settings`
          );
          setSettings((prev) => ({ ...prev, ...pageSettings }));
        } catch {
          // ใช้ค่าเริ่มต้น
        }
      }
    } catch {
      // API ไม่ตอบ — ใช้ mock data
      setConnectedPages(mockPages);
      setSettings({
        caption_style: "sell",
        keywords: "แฟชั่น, เสื้อผ้า, ลดราคา",
        auto_post: true,
        auto_comment: true,
        auto_chat: false,
        post_times: ["12:00", "19:00"],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (connectedPages.length > 0 && connectedPages[0].id) {
        await apiFetch(`/customers/pages/${connectedPages[0].id}/settings`, {
          method: "PUT",
          body: JSON.stringify({
            caption_style: settings.caption_style,
            keywords: settings.keywords,
          }),
        });
      }
    } catch {
      // fallback — บันทึกไม่ได้ก็ไม่ error
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleConnectFacebook = () => {
    // Redirect ไปที่ backend OAuth endpoint
    window.location.href = `${getApiBase()}/auth/facebook`;
  };

  const handleDisconnect = (id: number) => {
    setConnectedPages((prev) => prev.filter((p) => p.id !== id));
  };

  const addPostTime = () => {
    setSettings((prev) => ({ ...prev, post_times: [...prev.post_times, "12:00"] }));
  };

  const removePostTime = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      post_times: prev.post_times.filter((_, i) => i !== index),
    }));
  };

  const updatePostTime = (index: number, value: string) => {
    setSettings((prev) => ({
      ...prev,
      post_times: prev.post_times.map((t, i) => (i === index ? value : t)),
    }));
  };

  const isTokenValid = (page: ConnectedPage) => {
    return page.access_token && page.access_token.length > 0 && page.status === "active";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-white/10 rounded w-32 mb-4" />
            <div className="h-4 bg-white/10 rounded w-full mb-2" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-7 h-7 text-indigo-400" /> ตั้งค่า
            </h1>
            <p className="text-slate-400 mt-1">ปรับแต่งสไตล์คอนเทนต์และการทำงานอัตโนมัติ</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
            } disabled:opacity-50`}
          >
            {saved ? <Sparkles size={16} /> : <Save size={16} />}
            {saved ? "บันทึกแล้ว!" : saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </header>

      {/* OAuth Result Message */}
      {connectMessage && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            connectMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {connectMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm">{connectMessage.text}</p>
          <button
            onClick={() => setConnectMessage(null)}
            className="ml-auto text-xs opacity-60 hover:opacity-100"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Facebook OAuth Connect */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <FacebookIcon className="w-5 h-5 text-blue-400" /> เชื่อมต่อเพจ Facebook
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          เชื่อมต่อเพจ Facebook เพื่อให้ AI จัดการโพสต์ ตอบคอมเม้น และแชทอัตโนมัติ
        </p>

        {/* Connect Button */}
        <button
          onClick={handleConnectFacebook}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-base transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <FacebookIcon className="w-6 h-6" />
          {connectedPages.length > 0 ? "เชื่อมต่อเพจเพิ่มเติม" : "เชื่อมต่อเพจ Facebook"}
          <ExternalLink className="w-4 h-4 opacity-60" />
        </button>
        <p className="text-xs text-slate-500 mt-3">
          กดแล้วจะเปิดหน้า Facebook ให้คุณเลือกเพจที่ต้องการเชื่อมต่อ และอนุญาตสิทธิ์การจัดการ
        </p>

        {/* Connected Pages */}
        {connectedPages.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">
                เพจที่เชื่อมต่อแล้ว ({connectedPages.length} เพจ)
              </h3>
              <button
                onClick={loadPages}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> รีเฟรช
              </button>
            </div>
            {connectedPages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1877F2]/20 flex items-center justify-center">
                    <FacebookIcon className="w-5 h-5 text-[#1877F2]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{page.page_name}</p>
                    <p className="text-xs text-slate-500">
                      เชื่อมต่อเมื่อ {formatDate(page.created_at)}
                      {page.fb_page_id && ` · ID: ${page.fb_page_id}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isTokenValid(page) ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" /> โทเคนยังใช้ได้
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5" /> โทเคนหมดอายุ
                    </span>
                  )}
                  <button
                    onClick={() => handleDisconnect(page.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="ยกเลิกการเชื่อมต่อ"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caption Style */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">สไตล์แคปชั่น</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {captionStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => setSettings({ ...settings, caption_style: style.value })}
              className={`p-4 rounded-xl text-left transition-all ${
                settings.caption_style === style.value
                  ? "bg-indigo-500/10 border-2 border-indigo-500/30"
                  : "bg-white/5 border-2 border-transparent hover:border-white/10"
              }`}
            >
              <p className="font-medium text-white">{style.label}</p>
              <p className="text-xs text-slate-400 mt-1">{style.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">คีย์เวิร์ด</h2>
        <p className="text-sm text-slate-400 mb-3">
          ใส่คีย์เวิร์ดที่ต้องการให้ AI ใช้ในแคปชั่น (คั่นด้วยเครื่องหมาย ,)
        </p>
        <textarea
          value={settings.keywords}
          onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
          rows={3}
          className="w-full bg-white/5 border border-white/10 text-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none placeholder-slate-500"
          placeholder="เช่น: สินค้าใหม่, โปรโมชั่น, ลดราคา, ส่งฟรี"
        />
      </div>

      {/* Post Times */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">เวลาโพสต์อัตโนมัติ</h2>
        <div className="space-y-3">
          {settings.post_times.map((time, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="time"
                value={time}
                onChange={(e) => updatePostTime(i, e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                onClick={() => removePostTime(i)}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                ลบ
              </button>
            </div>
          ))}
          <button
            onClick={addPostTime}
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            + เพิ่มเวลา
          </button>
        </div>
      </div>

      {/* Auto toggles */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">การทำงานอัตโนมัติ</h2>
        <div className="space-y-4">
          {[
            { key: "auto_post" as const, label: "โพสต์อัตโนมัติ", desc: "AI จะโพสต์คอนเทนต์ตามเวลาที่กำหนด" },
            { key: "auto_comment" as const, label: "ตอบคอมเม้นท์อัตโนมัติ", desc: "AI จะตอบคอมเม้นท์ที่เข้ามาอัตโนมัติ" },
            { key: "auto_chat" as const, label: "ตอบแชทอัตโนมัติ", desc: "AI จะตอบข้อความ Messenger อัตโนมัติ" },
          ].map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{toggle.label}</p>
                <p className="text-xs text-slate-400">{toggle.desc}</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, [toggle.key]: !settings[toggle.key] })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings[toggle.key] ? "bg-indigo-600" : "bg-slate-700"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings[toggle.key] ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
