"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PageSettings {
  caption_style: string;
  keywords: string;
  auto_post: boolean;
  auto_comment: boolean;
  auto_chat: boolean;
  post_times: string[];
}

const captionStyles = [
  { value: "sexy", label: "🔥 เซ็กซี่", desc: "แคปชั่นเร้าใจ ดึงดูดความสนใจ" },
  { value: "cute", label: "🌸 น่ารัก", desc: "สไตล์คาวาอี้ น่ารักสดใส" },
  { value: "funny", label: "😂 ตลก", desc: "มุกตลก เฮฮา สร้างเสียงหัวเราะ" },
  { value: "sell", label: "💰 ขายของ", desc: "แคปชั่นขายสินค้า กระตุ้นยอดขาย" },
  { value: "classy", label: "✨ หรูหรา", desc: "สไตล์พรีเมียม หรูหราดูดี" },
];

export default function SettingsPage() {
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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiFetch<PageSettings>("/dashboard/settings");
      setSettings(data);
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/dashboard/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-slate-800 rounded w-32 mb-4" />
            <div className="h-4 bg-slate-800 rounded w-full mb-2" />
            <div className="h-4 bg-slate-800 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">⚙️ ตั้งค่า</h1>
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

      {/* Caption Style */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">สไตล์แคปชั่น</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {captionStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => setSettings({ ...settings, caption_style: style.value })}
              className={`p-4 rounded-xl text-left transition-all ${
                settings.caption_style === style.value
                  ? "bg-indigo-500/10 border-2 border-indigo-500/30"
                  : "bg-slate-800/50 border-2 border-transparent hover:border-slate-700"
              }`}
            >
              <p className="font-medium text-white">{style.label}</p>
              <p className="text-xs text-slate-400 mt-1">{style.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">คีย์เวิร์ด</h2>
        <p className="text-sm text-slate-400 mb-3">ใส่คีย์เวิร์ดที่ต้องการให้ AI ใช้ในแคปชั่น (คั่นด้วยเครื่องหมาย ,)</p>
        <textarea
          value={settings.keywords}
          onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
          rows={3}
          className="w-full bg-slate-800/60 border border-slate-700 text-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="เช่น: สินค้าใหม่, โปรโมชั่น, ลดราคา, ส่งฟรี"
        />
      </div>

      {/* Post Times */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">เวลาโพสต์อัตโนมัติ</h2>
        <div className="space-y-3">
          {settings.post_times.map((time, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="time"
                value={time}
                onChange={(e) => updatePostTime(i, e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => removePostTime(i)}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                ลบ
              </button>
            </div>
          ))}
          <button onClick={addPostTime} className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
            + เพิ่มเวลา
          </button>
        </div>
      </div>

      {/* Auto toggles */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
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
