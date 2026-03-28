"use client";

import { useState, useRef } from "react";
import {
  PenLine,
  Clock,
  History,
  Image as ImageIcon,
  Video,
  Upload,
  Sparkles,
  RefreshCw,
  Send,
  CalendarClock,
  GripVertical,
  Edit3,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Filter,
  X,
  Plus,
  Images,
  ChevronDown,
  Flame,
  Laugh,
  Gem,
  BookOpen,
  Search,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface MediaItem {
  id: number;
  name: string;
  type: "photo" | "video";
  url: string;
  thumbnail: string;
}

interface QueuePost {
  id: number;
  caption: string;
  mediaIds: number[];
  scheduledAt: string;
  status: "scheduled" | "draft";
}

interface HistoryPost {
  id: number;
  caption: string;
  mediaType: "photo" | "video" | "album";
  thumbnail: string;
  postedAt: string;
  status: "posted" | "failed";
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}

type TabKey = "create" | "queue" | "history";
type CaptionStyle = "sell" | "cute" | "funny" | "luxury" | "educate";
type HistoryFilter = "all" | "today" | "week" | "month";

// ─── Mock Data ───────────────────────────────────────────────────────
const mockMedia: MediaItem[] = [
  { id: 1, name: "product_hero_01.jpg", type: "photo", url: "/media/product_hero_01.jpg", thumbnail: "🛍️" },
  { id: 2, name: "summer_collection.jpg", type: "photo", url: "/media/summer_collection.jpg", thumbnail: "☀️" },
  { id: 3, name: "behind_scenes.jpg", type: "photo", url: "/media/behind_scenes.jpg", thumbnail: "🎬" },
  { id: 4, name: "customer_review.mp4", type: "video", url: "/media/customer_review.mp4", thumbnail: "🎥" },
  { id: 5, name: "flat_lay_setup.jpg", type: "photo", url: "/media/flat_lay_setup.jpg", thumbnail: "📸" },
  { id: 6, name: "new_arrival_dress.jpg", type: "photo", url: "/media/new_arrival_dress.jpg", thumbnail: "👗" },
  { id: 7, name: "packaging_unbox.mp4", type: "video", url: "/media/packaging_unbox.mp4", thumbnail: "📦" },
  { id: 8, name: "lifestyle_shoot.jpg", type: "photo", url: "/media/lifestyle_shoot.jpg", thumbnail: "✨" },
];

const mockQueue: QueuePost[] = [
  {
    id: 1,
    caption: "สินค้ามาใหม่ล็อตล่าสุด! ✨ ชุดเดรสคอลเลคชั่นซัมเมอร์ สวยปังทุกตัว ราคาเริ่มต้น 590 บาท #สินค้าใหม่ #แฟชั่น #เดรสสวย",
    mediaIds: [2, 6],
    scheduledAt: "2026-03-29T10:00:00",
    status: "scheduled",
  },
  {
    id: 2,
    caption: "รีวิวจากลูกค้าตัวจริง 💕 พี่แอนสั่งไป 3 ตัว กลับมาสั่งเพิ่มอีก 5 ตัว! ขอบคุณที่ไว้วางใจนะคะ #รีวิวจริง #ลูกค้าจริง",
    mediaIds: [4],
    scheduledAt: "2026-03-29T18:30:00",
    status: "scheduled",
  },
  {
    id: 3,
    caption: "เบื้องหลังการถ่ายแบบ 🎬 วันนี้ทีมงานเหนื่อยกันมาก แต่ภาพออกมาสวยมาก รอติดตามนะคะ #เบื้องหลัง #ถ่ายแบบ",
    mediaIds: [3],
    scheduledAt: "2026-03-30T12:00:00",
    status: "draft",
  },
];

const mockHistory: HistoryPost[] = [
  {
    id: 1,
    caption: "วันนี้มีโปรพิเศษค่ะ! 💕 ลด 50% ทุกชิ้น ถึงเที่ยงคืนนี้เท่านั้น! #โปรโมชั่น #ลดราคา #แฟชั่น",
    mediaType: "photo",
    thumbnail: "🛍️",
    postedAt: "2026-03-28T12:00:00",
    status: "posted",
    likes: 324,
    comments: 89,
    shares: 45,
    reach: 5200,
  },
  {
    id: 2,
    caption: "แพ็คของวันนี้ 50 ออเดอร์! 📦 ขอบคุณทุกคนนะคะ ส่งด่วนให้ทุกคนแล้ว #แพ็คของ #ส่งด่วน",
    mediaType: "video",
    thumbnail: "📦",
    postedAt: "2026-03-28T09:00:00",
    status: "posted",
    likes: 156,
    comments: 42,
    shares: 18,
    reach: 3100,
  },
  {
    id: 3,
    caption: "ชุดเดรสยอดฮิตกลับมาแล้ว! 🔥 รอบนี้มาเพิ่ม 5 สี สั่งด่วนก่อนหมดนะคะ",
    mediaType: "album",
    thumbnail: "👗",
    postedAt: "2026-03-27T19:00:00",
    status: "posted",
    likes: 287,
    comments: 134,
    shares: 67,
    reach: 6800,
  },
  {
    id: 4,
    caption: "วิธีมิกซ์แอนด์แมทช์ลุคทำงาน 📚 3 ชุด 3 สไตล์ จากเสื้อตัวเดียว!",
    mediaType: "photo",
    thumbnail: "📸",
    postedAt: "2026-03-27T12:00:00",
    status: "posted",
    likes: 198,
    comments: 56,
    shares: 89,
    reach: 4200,
  },
  {
    id: 5,
    caption: "LIVE สดวันนี้ 2 ทุ่มนะคะ! 🔴 เปิดตัวคอลเลคชั่นใหม่ มีแจกฟรีด้วย!",
    mediaType: "video",
    thumbnail: "🎥",
    postedAt: "2026-03-26T20:00:00",
    status: "failed",
    likes: 0,
    comments: 0,
    shares: 0,
    reach: 0,
  },
  {
    id: 6,
    caption: "ลูกค้ารีวิวกระเป๋าใบใหม่ 💼 สวยจริง ใช้จริง ทนจริง! ขอบคุณรูปสวยๆ นะคะ #รีวิว",
    mediaType: "photo",
    thumbnail: "💼",
    postedAt: "2026-03-26T14:00:00",
    status: "posted",
    likes: 245,
    comments: 78,
    shares: 34,
    reach: 3900,
  },
  {
    id: 7,
    caption: "ขอบคุณ 10K ผู้ติดตาม! 🎉🙏 จัดแจกของรางวัลฉลอง แชร์โพสต์นี้ลุ้นเลย! #แจกของรางวัล",
    mediaType: "photo",
    thumbnail: "🎉",
    postedAt: "2026-03-25T18:00:00",
    status: "posted",
    likes: 512,
    comments: 234,
    shares: 189,
    reach: 12400,
  },
  {
    id: 8,
    caption: "เสื้อยืดคอลเลคชั่น Minimal 🤍 ผ้าคอตตอน 100% ใส่สบาย ซักไม่หด ราคา 290 บาท",
    mediaType: "album",
    thumbnail: "🤍",
    postedAt: "2026-03-25T10:00:00",
    status: "posted",
    likes: 178,
    comments: 45,
    shares: 23,
    reach: 2800,
  },
];

const captionStyles: { key: CaptionStyle; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "sell", label: "ขายตรง", icon: <Flame size={16} />, desc: "กระตุ้นยอดขาย ปิดดีล" },
  { key: "cute", label: "น่ารัก", icon: <Heart size={16} />, desc: "อบอุ่น เป็นกันเอง" },
  { key: "funny", label: "ตลก", icon: <Laugh size={16} />, desc: "ขำๆ ไวรัล" },
  { key: "luxury", label: "หรูหรา", icon: <Gem size={16} />, desc: "พรีเมียม ดูแพง" },
  { key: "educate", label: "ให้ความรู้", icon: <BookOpen size={16} />, desc: "สอน แนะนำ ทิปส์" },
];

const aiCaptions: Record<CaptionStyle, string[]> = {
  sell: [
    "🔥 โปรแรงมาแล้วค่า! วันนี้ลดสูงสุด 50%! สินค้ามีจำนวนจำกัด ใครไม่ซื้อตอนนี้เสียใจแน่นอน! 💥 สั่งเลย DM มาได้เลยค่ะ #โปรโมชั่น #ลดราคา #สินค้าขายดี",
    "💰 ลดกระหน่ำ! ราคาพิเศษสุดๆ แบบนี้ไม่ได้มีบ่อยนะคะ กดสั่งด่วนก่อนหมด! สินค้าพร้อมส่งทุกชิ้น ✅ #Flash Sale #สั่งเลย",
  ],
  cute: [
    "สวัสดีจ้า 💕 วันนี้มีของน่ารักๆ มาฝากค่ะ~ ดูแล้วน่ารักไหมคะ? ถูกใจตัวไหนทักมาได้เลยนะคะ 🥰 รอน้องๆ อยู่น้า~ #น่ารักมาก #ของน่ารัก",
    "หวัดดีค่า~ 🌸 ของใหม่มาเพิ่มอีกแล้วน้า น่ารักจนอยากกอดเลย 🤗 ใครอยากได้ยกมือขึ้น! 🙋‍♀️ #ของมาใหม่ #น่ารักปุ๊กลุ้ก",
  ],
  funny: [
    "😂 ใครยังไม่มีของพวกนี้ยกมือขึ้น! ...อ้าว ยกกันเยอะขนาดนี้เลย? งั้นรีบสั่งเลยค่ะ ก่อนมือจะเมื่อย 🤣 #ขำไปสั่งไป #ต้องมี",
    "เงินเดือนออกปุ๊บ กระเป๋าสตางค์ร้องไห้ปั๊บ 😭💸 แต่สวยขนาดนี้ไม่ซื้อก็บาปนะคะ! จัดเลย จัดเบาๆ 555+ #เงินเดือนออก #จัดเลย",
  ],
  luxury: [
    "✨ Exclusive Collection — คัดสรรเฉพาะชิ้นพิเศษ เพื่อคุณที่มีสไตล์เหนือระดับ ผลิตจำนวนจำกัดเพียง 50 ชิ้น ดีไซน์ที่ไม่ซ้ำใคร #Premium #LimitedEdition #Luxury",
    "🖤 The Art of Elegance — ทุกรายละเอียดถูกดีไซน์อย่างพิถีพิถัน วัสดุระดับพรีเมียม สัมผัสความหรูที่แตกต่าง #Exclusive #HighEnd #หรูหรา",
  ],
  educate: [
    "📚 รู้หรือเปล่า? วิธีเลือกเสื้อผ้าให้เข้ากับรูปร่าง สำคัญมากๆ ค่ะ! วันนี้มีทิปส์ดีๆ มาฝาก อ่านจบแล้วเลือกชุดถูกใจได้แน่นอน 💡 #ทิปส์แฟชั่น #ความรู้ #HowTo",
    "💡 5 เทคนิคมิกซ์แอนด์แมทช์แบบมือโปร! ไม่ต้องซื้อเยอะ แค่มีพื้นฐาน 5 ชิ้นก็แต่งได้ทั้งสัปดาห์ เก็บไว้เลยค่ะ 📌 #เทคนิคแต่งตัว #แฟชั่นง่ายๆ",
  ],
};

// ─── Helper ──────────────────────────────────────────────────────────
function formatDateTime(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  const day = d.getDate();
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${day} ${months[d.getMonth()]}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} น.`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "เมื่อสักครู่";
  if (hours < 24) return `${hours} ชม.ที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "เมื่อวาน";
  return `${days} วันที่แล้ว`;
}

function engagementPercent(value: number, max: number) {
  return max > 0 ? Math.min((value / max) * 100, 100) : 0;
}

// ─── Component ───────────────────────────────────────────────────────
export default function PostsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("create");

  // ─── Create Tab State ─────────────────────────────
  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
  const [caption, setCaption] = useState("");
  const [keywords, setKeywords] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<CaptionStyle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Queue Tab State ──────────────────────────────
  const [queue, setQueue] = useState(mockQueue);
  const [editingQueueId, setEditingQueueId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");

  // ─── History Tab State ────────────────────────────
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  // ─── Tab Config ───────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "create", label: "สร้างโพสต์", icon: <PenLine size={18} /> },
    { key: "queue", label: "คิวรอโพสต์", icon: <Clock size={18} />, count: queue.filter((q) => q.status === "scheduled").length },
    { key: "history", label: "ประวัติโพสต์", icon: <History size={18} />, count: mockHistory.length },
  ];

  // ─── Create Handlers ──────────────────────────────
  const toggleMedia = (id: number) => {
    setSelectedMedia((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const generateCaption = (style: CaptionStyle) => {
    setSelectedStyle(style);
    setIsGenerating(true);
    setTimeout(() => {
      const options = aiCaptions[style];
      const random = options[Math.floor(Math.random() * options.length)];
      setCaption(random);
      setIsGenerating(false);
    }, 1200);
  };

  const regenerateCaption = () => {
    if (selectedStyle) generateCaption(selectedStyle);
  };

  const handlePost = () => {
    alert("โพสต์สำเร็จ! (mock)");
    setCaption("");
    setSelectedMedia([]);
    setKeywords("");
    setSelectedStyle(null);
  };

  const handleSchedule = () => {
    if (!scheduleDate || !scheduleTime) return;
    alert(`ตั้งเวลาโพสต์: ${scheduleDate} ${scheduleTime} (mock)`);
    setShowScheduler(false);
    setCaption("");
    setSelectedMedia([]);
    setKeywords("");
  };

  // ─── Queue Handlers ───────────────────────────────
  const deleteQueue = (id: number) => setQueue((q) => q.filter((p) => p.id !== id));
  const postNow = (id: number) => {
    alert(`โพสต์ทันที ID:${id} (mock)`);
    deleteQueue(id);
  };
  const startEditQueue = (post: QueuePost) => {
    setEditingQueueId(post.id);
    setEditCaption(post.caption);
  };
  const saveEditQueue = () => {
    setQueue((q) => q.map((p) => (p.id === editingQueueId ? { ...p, caption: editCaption } : p)));
    setEditingQueueId(null);
  };

  // ─── History Filter ───────────────────────────────
  const now = new Date();
  const filteredHistory = mockHistory.filter((p) => {
    if (historyFilter === "all") return true;
    const posted = new Date(p.postedAt);
    const diffDays = (now.getTime() - posted.getTime()) / 86400000;
    if (historyFilter === "today") return diffDays < 1;
    if (historyFilter === "week") return diffDays < 7;
    if (historyFilter === "month") return diffDays < 30;
    return true;
  });

  const maxEngagement = Math.max(...mockHistory.map((p) => p.likes + p.comments + p.shares), 1);

  // ─── Render ────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="pb-4 border-b border-white/10">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          จัดการโพสต์
        </h1>
        <p className="text-slate-400 mt-1">สร้าง ตั้งเวลา และติดตามโพสต์ทั้งหมดของคุณ</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex-1 justify-center ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-white/20" : "bg-white/10 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB 1: สร้างโพสต์
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ─── Left: Media Selection (60%) ──────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                alert("อัพโหลดสำเร็จ! (mock)");
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative bg-white/5 backdrop-blur-xl border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                dragOver ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]" : "border-white/20 hover:border-indigo-400/50 hover:bg-white/[0.07]"
              }`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" multiple />
              <Upload className={`mx-auto mb-3 transition-colors ${dragOver ? "text-indigo-400" : "text-slate-500"}`} size={40} />
              <p className="text-white font-medium">ลากไฟล์มาวางที่นี่</p>
              <p className="text-slate-400 text-sm mt-1">หรือคลิกเพื่อเลือกรูปภาพ / วิดีโอ</p>
              <p className="text-slate-500 text-xs mt-2">รองรับ JPG, PNG, MP4 สูงสุด 50MB</p>
            </div>

            {/* Media Library */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Images size={18} className="text-indigo-400" />
                  <h3 className="text-white font-semibold">คลังสื่อ</h3>
                  <span className="text-xs text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">{mockMedia.length} ไฟล์</span>
                </div>
                {selectedMedia.length > 0 && (
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                    เลือกแล้ว {selectedMedia.length} ไฟล์
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mockMedia.map((media) => {
                  const isSelected = selectedMedia.includes(media.id);
                  return (
                    <button
                      key={media.id}
                      onClick={() => toggleMedia(media.id)}
                      className={`relative group aspect-square rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                          : "border-white/10 bg-white/5 hover:border-white/30 hover:scale-[1.02]"
                      }`}
                    >
                      {/* Thumbnail Placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl">{media.thumbnail}</span>
                      </div>

                      {/* Type badge */}
                      <div className="absolute top-1.5 left-1.5">
                        {media.type === "video" ? (
                          <span className="bg-red-500/80 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Video size={10} /> VDO
                          </span>
                        ) : (
                          <span className="bg-blue-500/80 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <ImageIcon size={10} /> IMG
                          </span>
                        )}
                      </div>

                      {/* Check circle */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={12} className="text-white" />
                        </div>
                      )}

                      {/* Name */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[10px] text-white/80 truncate">{media.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── Right: Caption & Preview (40%) ───────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Caption Area */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <PenLine size={16} className="text-violet-400" />
                แคปชั่น
              </h3>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="เขียนแคปชั่นที่นี่... หรือให้ AI ช่วยเขียนด้านล่าง"
                className="w-full h-36 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-slate-500">{caption.length} ตัวอักษร</span>
                {caption && (
                  <button onClick={() => setCaption("")} className="text-xs text-slate-400 hover:text-red-400 transition-colors">
                    ล้าง
                  </button>
                )}
              </div>
            </div>

            {/* AI Caption Generator */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                AI สร้างแคปชั่น
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {captionStyles.map((style) => (
                  <button
                    key={style.key}
                    onClick={() => generateCaption(style.key)}
                    disabled={isGenerating}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 border ${
                      selectedStyle === style.key
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20"
                    } ${isGenerating ? "opacity-50 cursor-wait" : "hover:scale-[1.02]"}`}
                  >
                    {style.icon}
                    <div className="text-left">
                      <div>{style.label}</div>
                      <div className="text-[10px] text-slate-500">{style.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              {selectedStyle && (
                <button
                  onClick={regenerateCaption}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all hover:scale-[1.01]"
                >
                  <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
                  {isGenerating ? "กำลังสร้าง..." : "สุ่มแคปชั่นใหม่"}
                </button>
              )}
            </div>

            {/* Keywords */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Search size={16} className="text-emerald-400" />
                คีย์เวิร์ด
              </h3>
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="เช่น #แฟชั่น #เสื้อผ้า #โปรโมชั่น"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            {/* Post Preview */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Eye size={16} className="text-blue-400" />
                ตัวอย่างโพสต์
              </h3>
              <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                {/* FB Post Header */}
                <div className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                    PP
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">PostPilot Shop</p>
                    <p className="text-xs text-gray-500">เมื่อสักครู่</p>
                  </div>
                </div>
                {/* Caption */}
                <div className="px-3 pb-2">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {caption || "แคปชั่นจะแสดงที่นี่..."}
                  </p>
                </div>
                {/* Image placeholder */}
                <div className="bg-gray-100 aspect-video flex items-center justify-center">
                  {selectedMedia.length > 0 ? (
                    <div className="flex items-center gap-2">
                      {selectedMedia.slice(0, 4).map((id) => {
                        const m = mockMedia.find((x) => x.id === id);
                        return (
                          <span key={id} className="text-4xl">
                            {m?.thumbnail}
                          </span>
                        );
                      })}
                      {selectedMedia.length > 4 && (
                        <span className="text-sm text-gray-500">+{selectedMedia.length - 4}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon size={40} className="mx-auto mb-1" />
                      <p className="text-xs">เลือกรูปจากคลัง</p>
                    </div>
                  )}
                </div>
                {/* Engagement bar */}
                <div className="flex justify-around py-2 border-t border-gray-200 text-gray-500 text-xs">
                  <span className="flex items-center gap-1">
                    <Heart size={14} /> ถูกใจ
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} /> แสดงความคิดเห็น
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 size={14} /> แชร์
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePost}
                disabled={!caption && selectedMedia.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-40 disabled:hover:scale-100"
              >
                <Send size={16} />
                โพสต์ทันที
              </button>
              <button
                onClick={() => setShowScheduler(!showScheduler)}
                disabled={!caption && selectedMedia.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:scale-[1.02] transition-all duration-300 disabled:opacity-40 disabled:hover:scale-100"
              >
                <CalendarClock size={16} />
                ตั้งเวลา
              </button>
            </div>

            {/* Schedule Popup */}
            {showScheduler && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-indigo-500/30 rounded-2xl p-5 shadow-lg shadow-indigo-500/10 animate-in">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <CalendarClock size={16} className="text-indigo-400" />
                  ตั้งเวลาโพสต์
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">วันที่</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">เวลา</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSchedule}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:scale-[1.02] transition-all"
                  >
                    ยืนยันตั้งเวลา
                  </button>
                  <button
                    onClick={() => setShowScheduler(false)}
                    className="px-4 py-2.5 rounded-xl text-sm text-slate-400 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 2: คิวรอโพสต์
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {queue.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-16 text-center">
              <Clock className="mx-auto text-slate-600 mb-3" size={48} />
              <p className="text-slate-400 text-lg">ยังไม่มีโพสต์ในคิว</p>
              <p className="text-slate-500 text-sm mt-1">สร้างโพสต์แล้วตั้งเวลาเพื่อเพิ่มในคิว</p>
            </div>
          ) : (
            queue.map((post, index) => (
              <div
                key={post.id}
                className="group bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Drag handle + order */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <GripVertical size={18} className="text-slate-600 cursor-grab" />
                    <span className="text-xs text-slate-500 font-mono">#{index + 1}</span>
                  </div>

                  {/* Media thumbnails */}
                  <div className="flex gap-1.5 shrink-0">
                    {post.mediaIds.map((mid) => {
                      const media = mockMedia.find((m) => m.id === mid);
                      return (
                        <div key={mid} className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                          {media?.thumbnail || "📷"}
                        </div>
                      );
                    })}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingQueueId === post.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          className="w-full h-20 bg-white/5 border border-indigo-500/30 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <div className="flex gap-2">
                          <button onClick={saveEditQueue} className="px-4 py-1.5 rounded-lg text-xs bg-indigo-500 text-white hover:bg-indigo-400 transition-colors">
                            บันทึก
                          </button>
                          <button onClick={() => setEditingQueueId(null)} className="px-4 py-1.5 rounded-lg text-xs text-slate-400 bg-white/5 hover:bg-white/10 transition-colors">
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-200 line-clamp-2 mb-2">{post.caption}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs">
                            <CalendarClock size={12} className="text-indigo-400" />
                            <span className="text-slate-400">{formatDateTime(post.scheduledAt)}</span>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              post.status === "scheduled"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                            }`}
                          >
                            {post.status === "scheduled" ? "ตั้งเวลาแล้ว" : "แบบร่าง"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingQueueId !== post.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditQueue(post)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        title="แก้ไขแคปชั่น"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => postNow(post.id)}
                        className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
                        title="โพสต์ทันที"
                      >
                        <Play size={15} />
                      </button>
                      <button
                        onClick={() => deleteQueue(post.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="ลบ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 3: ประวัติโพสต์
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            {(["all", "today", "week", "month"] as HistoryFilter[]).map((f) => {
              const labels: Record<HistoryFilter, string> = { all: "ทั้งหมด", today: "วันนี้", week: "สัปดาห์นี้", month: "เดือนนี้" };
              return (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                    historyFilter === f
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
            <span className="ml-auto text-xs text-slate-500">{filteredHistory.length} โพสต์</span>
          </div>

          {/* Timeline */}
          {filteredHistory.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-16 text-center">
              <History className="mx-auto text-slate-600 mb-3" size={48} />
              <p className="text-slate-400 text-lg">ไม่มีโพสต์ในช่วงเวลานี้</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-violet-500/30 to-transparent" />

              <div className="space-y-4">
                {filteredHistory.map((post) => {
                  const totalEngagement = post.likes + post.comments + post.shares;
                  return (
                    <div key={post.id} className="relative flex gap-4 group">
                      {/* Timeline dot */}
                      <div className="relative z-10 shrink-0">
                        <div
                          className={`w-[46px] h-[46px] rounded-xl flex items-center justify-center text-xl border-2 transition-all duration-300 group-hover:scale-110 ${
                            post.status === "posted"
                              ? "border-emerald-500/50 bg-slate-900"
                              : "border-red-500/50 bg-slate-900"
                          }`}
                        >
                          {post.thumbnail}
                        </div>
                      </div>

                      {/* Card */}
                      <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:shadow-lg transition-all duration-300 group-hover:translate-x-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              {post.status === "posted" ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                  <CheckCircle size={11} /> โพสต์แล้ว
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                                  <XCircle size={11} /> ล้มเหลว
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                                {post.mediaType === "album" ? "อัลบั้ม" : post.mediaType === "video" ? "วิดีโอ" : "รูปภาพ"}
                              </span>
                            </div>
                            <p className="text-sm text-slate-200 line-clamp-2">{post.caption}</p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-xs text-slate-500">{formatDateShort(post.postedAt)}</p>
                            <p className="text-xs text-slate-400">{formatTime(post.postedAt)}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(post.postedAt)}</p>
                          </div>
                        </div>

                        {/* Engagement Bars */}
                        {post.status === "posted" && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-white/5">
                            {/* Stats row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-pink-400 mb-0.5">
                                  <Heart size={12} />
                                  <span className="text-sm font-semibold">{post.likes.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-700"
                                    style={{ width: `${engagementPercent(post.likes, maxEngagement)}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-blue-400 mb-0.5">
                                  <MessageCircle size={12} />
                                  <span className="text-sm font-semibold">{post.comments.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700"
                                    style={{ width: `${engagementPercent(post.comments, maxEngagement)}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
                                  <Share2 size={12} />
                                  <span className="text-sm font-semibold">{post.shares.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-700"
                                    style={{ width: `${engagementPercent(post.shares, maxEngagement)}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-violet-400 mb-0.5">
                                  <Eye size={12} />
                                  <span className="text-sm font-semibold">{post.reach.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-700"
                                    style={{ width: `${engagementPercent(post.reach, 15000)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
