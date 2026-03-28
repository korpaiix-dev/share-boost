"use client";

import { useState, useRef } from "react";
import {
  Wand2,
  Upload,
  Trash2,
  Clock,
  CheckCircle2,
  Pin,
  X,
  Plus,
  Sparkles,
  Image as ImageIcon,
  Settings2,
  Palette,
  Eye,
  Hash,
  Save,
} from "lucide-react";

/* ─── Types ─── */
interface MediaItem {
  id: number;
  filename: string;
  url: string;
  size: number;
  status: "waiting" | "posted" | "queued";
  postedAt?: string;
  scheduledAt?: string;
}

/* ─── Mock Data ─── */
const mockMedia: MediaItem[] = [
  { id: 1, filename: "promo_summer.jpg", url: "/placeholder.jpg", size: 245000, status: "posted", postedAt: "27 มี.ค. 12:00" },
  { id: 2, filename: "new_collection.jpg", url: "/placeholder.jpg", size: 312000, status: "posted", postedAt: "26 มี.ค. 19:00" },
  { id: 3, filename: "flash_sale.jpg", url: "/placeholder.jpg", size: 198000, status: "posted", postedAt: "25 มี.ค. 12:00" },
  { id: 4, filename: "product_bag.jpg", url: "/placeholder.jpg", size: 275000, status: "queued", scheduledAt: "28 มี.ค. 12:00" },
  { id: 5, filename: "product_shoes.jpg", url: "/placeholder.jpg", size: 340000, status: "queued", scheduledAt: "28 มี.ค. 19:00" },
  { id: 6, filename: "lifestyle_01.jpg", url: "/placeholder.jpg", size: 410000, status: "queued", scheduledAt: "29 มี.ค. 12:00" },
  { id: 7, filename: "model_look.jpg", url: "/placeholder.jpg", size: 290000, status: "waiting" },
  { id: 8, filename: "flat_lay.jpg", url: "/placeholder.jpg", size: 185000, status: "waiting" },
  { id: 9, filename: "behind_scene.jpg", url: "/placeholder.jpg", size: 520000, status: "waiting" },
  { id: 10, filename: "review_cust.jpg", url: "/placeholder.jpg", size: 155000, status: "waiting" },
];

const captionStyles = [
  { value: "sell", label: "ขายตรง", emoji: "🔥", desc: "แคปชั่นกระตุ้นยอดขาย ปิดการขายเร็ว" },
  { value: "cute", label: "น่ารัก", emoji: "💕", desc: "สไตล์คาวาอี้ สดใส เข้าถึงง่าย" },
  { value: "funny", label: "ตลก", emoji: "😂", desc: "มุกตลก เฮฮา สร้างเสียงหัวเราะ" },
  { value: "luxury", label: "หรูหรา", emoji: "✨", desc: "พรีเมียม ดูดี สร้างมูลค่า" },
  { value: "edu", label: "ให้ความรู้", emoji: "📚", desc: "แชร์ความรู้ สร้างความน่าเชื่อถือ" },
];

const imageStyles = [
  { value: "realistic", label: "ภาพถ่ายจริง", emoji: "🎨", desc: "สมจริง คมชัด" },
  { value: "digital-art", label: "ศิลปะดิจิทัล", emoji: "🖼️", desc: "กราฟิกสวยงาม" },
  { value: "cartoon", label: "การ์ตูน", emoji: "🎭", desc: "สไตล์การ์ตูน" },
  { value: "product-shot", label: "ถ่ายสินค้า", emoji: "📸", desc: "สตูดิโอ มืออาชีพ" },
  { value: "cinematic", label: "ภาพยนตร์", emoji: "🌅", desc: "โทนหนัง ดราม่า" },
  { value: "sketch", label: "ลายเส้น", emoji: "✏️", desc: "วาดมือ ร่างภาพ" },
  { value: "pop-art", label: "ป๊อปอาร์ต", emoji: "🎪", desc: "สีสดใส จัดจ้าน" },
  { value: "thai-style", label: "สไตล์ไทย", emoji: "🏮", desc: "ลวดลายไทย" },
];

const aspectRatios = [
  { value: "1:1", label: "1:1", desc: "สี่เหลี่ยมจัตุรัส" },
  { value: "4:5", label: "4:5", desc: "แนวตั้ง" },
  { value: "16:9", label: "16:9", desc: "แนวนอน" },
];

/* ─── Tabs ─── */
type Tab = "gallery" | "settings" | "generate";

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<Tab>("gallery");

  const tabs = [
    { key: "gallery" as Tab, label: "คลังรูปภาพ", icon: ImageIcon },
    { key: "settings" as Tab, label: "ตั้งค่าโพสต์อัตโนมัติ", icon: Settings2 },
    { key: "generate" as Tab, label: "AI สร้างรูปภาพ", icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Wand2 className="w-7 h-7 text-indigo-400" /> โพสต์อัตโนมัติ
        </h1>
        <p className="text-slate-400 mt-1">จัดการคลังรูปภาพ ตั้งค่า AI โพสต์ และสร้างรูปด้วย AI</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "gallery" && <GalleryTab />}
      {activeTab === "settings" && <SettingsTab />}
      {activeTab === "generate" && <GenerateTab />}
    </div>
  );
}

/* ════════════════════════════════════════════
   Tab 1: คลังรูปภาพ
   ════════════════════════════════════════════ */
function GalleryTab() {
  const [media, setMedia] = useState<MediaItem[]>(mockMedia);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const statusBadge = (item: MediaItem) => {
    if (item.status === "posted")
      return (
        <span className="flex items-center gap-1 text-[11px] text-emerald-400">
          <CheckCircle2 className="w-3 h-3" /> โพสต์แล้ว {item.postedAt}
        </span>
      );
    if (item.status === "queued")
      return (
        <span className="flex items-center gap-1 text-[11px] text-amber-400">
          <Pin className="w-3 h-3" /> ในคิว {item.scheduledAt}
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-[11px] text-slate-500">
        <Clock className="w-3 h-3" /> รอโพสต์
      </span>
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("ต้องการลบรูปนี้?")) return;
    setMedia((prev) => prev.filter((m) => m.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    const newItems: MediaItem[] = files.map((f, i) => ({
      id: Date.now() + i,
      filename: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
      status: "waiting" as const,
    }));
    setMedia((prev) => [...newItems, ...prev]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems: MediaItem[] = files.map((f, i) => ({
      id: Date.now() + i,
      filename: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
      status: "waiting" as const,
    }));
    setMedia((prev) => [...newItems, ...prev]);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/10 hover:border-white/20 bg-white/5"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto w-8 h-8 text-slate-500 mb-2" />
        <p className="text-sm text-slate-400">ลากวางรูปที่นี่ หรือ <span className="text-indigo-400">คลิกเลือกไฟล์</span></p>
        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-slate-400">
        <span>ทั้งหมด {media.length} รูป</span>
        <span className="text-emerald-400">โพสต์แล้ว {media.filter((m) => m.status === "posted").length}</span>
        <span className="text-amber-400">ในคิว {media.filter((m) => m.status === "queued").length}</span>
        <span className="text-slate-500">รอโพสต์ {media.filter((m) => m.status === "waiting").length}</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {media.map((item) => (
          <div key={item.id} className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="aspect-square bg-slate-800 relative">
              <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-9 h-9 bg-red-500/80 hover:bg-red-500 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-slate-300 truncate font-medium">{item.filename}</p>
              <p className="text-[11px] text-slate-500">{formatSize(item.size)}</p>
              <div className="mt-1.5">{statusBadge(item)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Tab 2: ตั้งค่าโพสต์อัตโนมัติ
   ════════════════════════════════════════════ */
function SettingsTab() {
  const [autoPost, setAutoPost] = useState(true);
  const [captionStyle, setCaptionStyle] = useState("sell");
  const [keywords, setKeywords] = useState<string[]>(["แฟชั่น", "เสื้อผ้า", "ลดราคา", "ส่งฟรี"]);
  const [keywordInput, setKeywordInput] = useState("");
  const [postTimes, setPostTimes] = useState(["12:00", "19:00"]);
  const [hashtags, setHashtags] = useState<string[]>(["สินค้าใหม่", "โปรโมชั่น", "ส่งฟรี", "ลดราคา"]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [saved, setSaved] = useState(false);

  const addKeyword = () => {
    const v = keywordInput.trim();
    if (v && !keywords.includes(v)) {
      setKeywords([...keywords, v]);
    }
    setKeywordInput("");
  };

  const addHashtag = () => {
    const v = hashtagInput.trim().replace(/^#/, "");
    if (v && !hashtags.includes(v)) {
      setHashtags([...hashtags, v]);
    }
    setHashtagInput("");
  };

  const addPostTime = () => setPostTimes([...postTimes, "12:00"]);
  const removePostTime = (i: number) => setPostTimes(postTimes.filter((_, idx) => idx !== i));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toggle AI Auto Post */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">AI โพสต์อัตโนมัติ</h2>
            <p className="text-sm text-slate-400 mt-0.5">เปิดให้ AI จัดการโพสต์คอนเทนต์ตามเวลาที่กำหนด</p>
          </div>
          <button
            onClick={() => setAutoPost(!autoPost)}
            className={`relative w-16 h-8 rounded-full transition-colors ${
              autoPost ? "bg-indigo-600" : "bg-slate-700"
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-lg ${
                autoPost ? "translate-x-9" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Caption Style */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">สไตล์แคปชั่น</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {captionStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => setCaptionStyle(style.value)}
              className={`p-4 rounded-xl text-left transition-all ${
                captionStyle === style.value
                  ? "bg-indigo-500/15 border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/5"
                  : "bg-white/5 border-2 border-transparent hover:border-white/10"
              }`}
            >
              <p className="font-medium text-white text-lg">{style.emoji} {style.label}</p>
              <p className="text-xs text-slate-400 mt-1">{style.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">คีย์เวิร์ด</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            placeholder="เพิ่มคีย์เวิร์ด..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button onClick={addKeyword} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span key={kw} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300">
              {kw}
              <button onClick={() => setKeywords(keywords.filter((k) => k !== kw))} className="hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Post Times */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">เวลาโพสต์</h2>
        <div className="space-y-3">
          {postTimes.map((time, i) => (
            <div key={i} className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-500" />
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  const updated = [...postTimes];
                  updated[i] = e.target.value;
                  setPostTimes(updated);
                }}
                className="bg-white/5 border border-white/10 text-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button onClick={() => removePostTime(i)} className="text-red-400 hover:text-red-300 text-sm transition-colors">
                ลบ
              </button>
            </div>
          ))}
          <button onClick={addPostTime} className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors flex items-center gap-1">
            <Plus className="w-4 h-4" /> เพิ่มเวลา
          </button>
        </div>
      </div>

      {/* Hashtags */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-indigo-400" /> แฮชแท็ก
        </h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHashtag()}
            placeholder="เพิ่มแฮชแท็ก..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button onClick={addHashtag} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-300">
              #{tag}
              <button onClick={() => setHashtags(hashtags.filter((t) => t !== tag))} className="hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-400" /> ตัวอย่างโพสต์ถัดไป
        </h2>
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">P</div>
            <div>
              <p className="text-sm font-medium text-white">เพจของคุณ</p>
              <p className="text-[11px] text-slate-500">กำหนดโพสต์: 28 มี.ค. 12:00</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {captionStyle === "sell" && "🔥 โปรสุดปัง! สินค้าใหม่ลดราคาพิเศษ ช้าหมดอดนะจ้า รีบจัดเลย!"}
            {captionStyle === "cute" && "💕 มาแล้วจ้า~ สินค้าน่ารักๆ ที่รอคุณอยู่ ชอบตัวไหนทักมาเลยนะคะ"}
            {captionStyle === "funny" && "😂 ของดีไม่ต้องบอกเยอะ ดูรูปแล้วจัดเลย กระเป๋าสตางค์ไม่ทันตั้งตัว!"}
            {captionStyle === "luxury" && "✨ Exclusive Collection ที่รังสรรค์มาเพื่อคุณโดยเฉพาะ ยกระดับสไตล์ของคุณ"}
            {captionStyle === "edu" && "📚 รู้หรือไม่? เทรนด์แฟชั่นปีนี้เน้นความยั่งยืน มาดูกันว่ามีอะไรน่าสนใจบ้าง"}
          </p>
          <p className="text-xs text-indigo-400 mt-3">
            {hashtags.map((t) => `#${t}`).join(" ")}
          </p>
          <div className="mt-3 aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
          saved
            ? "bg-emerald-600 text-white"
            : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white shadow-lg shadow-indigo-500/20"
        }`}
      >
        {saved ? <Sparkles size={16} /> : <Save size={16} />}
        {saved ? "บันทึกแล้ว!" : "บันทึกการตั้งค่า"}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════
   Tab 3: AI สร้างรูปภาพ
   ════════════════════════════════════════════ */
function GenerateTab() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [ratio, setRatio] = useState("1:1");
  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setResults([]);
    setTimeout(() => {
      setGenerating(false);
      setResults(Array.from({ length: count }, (_, i) => `generated_${i + 1}.jpg`));
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Prompt */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">อธิบายรูปที่ต้องการ</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 text-slate-200 rounded-xl p-4 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
          placeholder="เช่น: ภาพสินค้ากระเป๋าหนังสีน้ำตาล วางบนโต๊ะไม้ แสงธรรมชาติ บรรยากาศคาเฟ่"
        />
      </div>

      {/* Image Style */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">สไตล์รูป</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {imageStyles.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`p-3 rounded-xl text-center transition-all ${
                style === s.value
                  ? "bg-indigo-500/15 border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/5"
                  : "bg-white/5 border-2 border-transparent hover:border-white/10"
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <p className="text-xs font-medium text-white mt-1">{s.label}</p>
              <p className="text-[10px] text-slate-400">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio & Count */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">ขนาดรูป</h2>
          <div className="flex gap-3">
            {aspectRatios.map((ar) => (
              <button
                key={ar.value}
                onClick={() => setRatio(ar.value)}
                className={`flex-1 py-3 rounded-xl text-center transition-all ${
                  ratio === ar.value
                    ? "bg-indigo-500/15 border-2 border-indigo-500/30"
                    : "bg-white/5 border-2 border-transparent hover:border-white/10"
                }`}
              >
                <p className="text-sm font-bold text-white">{ar.label}</p>
                <p className="text-[10px] text-slate-400">{ar.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">จำนวนรูป</h2>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`flex-1 py-3 rounded-xl text-center transition-all ${
                  count === n
                    ? "bg-indigo-500/15 border-2 border-indigo-500/30"
                    : "bg-white/5 border-2 border-transparent hover:border-white/10"
                }`}
              >
                <p className="text-lg font-bold text-white">{n}</p>
                <p className="text-[10px] text-slate-400">รูป</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || !prompt.trim()}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
      >
        <Palette className="w-5 h-5" />
        {generating ? "กำลังสร้างรูป..." : "🎨 สร้างรูป"}
      </button>

      {/* Results */}
      {(generating || results.length > 0) && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">ผลลัพธ์</h2>
          <div className={`grid gap-4 ${results.length > 2 ? "grid-cols-2" : results.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-md"}`}>
            {generating
              ? Array.from({ length: count }, (_, i) => (
                  <div key={i} className="aspect-square bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 animate-pulse">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">กำลังสร้าง...</p>
                  </div>
                ))
              : results.map((name, i) => (
                  <div key={i} className="relative group">
                    <div className="aspect-square bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border border-white/10 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-300">สร้างสำเร็จ!</p>
                        <p className="text-xs text-slate-500 mt-1">{name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors text-center">
                        บันทึกเข้าคลัง
                      </button>
                      <button className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors text-center">
                        โพสต์ทันที
                      </button>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}
