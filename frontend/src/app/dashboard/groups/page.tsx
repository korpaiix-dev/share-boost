"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Rocket,
  ChevronDown,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Zap,
  Gauge,
  Snail,
  Sparkles,
  Heart,
  MessageCircle,
  Flame,
  Megaphone,
  PenLine,
  UserPlus,
  Globe,
  Tag,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square,
  Filter,
  X,
} from "lucide-react";

/* ─── Types ─── */
interface Group {
  id: number;
  name: string;
  members: number;
  category: string;
  enabled: boolean;
  totalShares: number;
  lastShared: string | null;
}

interface SearchResult {
  id: number;
  name: string;
  members: number;
  description: string;
  status: "none" | "pending" | "joined" | "rejected";
}

interface ShareLog {
  groupId: number;
  groupName: string;
  status: "success" | "failed";
  time: string;
}

/* ─── Constants ─── */
const CATEGORIES: { name: string; color: string; bg: string; border: string }[] = [
  { name: "ทั้งหมด", color: "text-white", bg: "bg-white/10", border: "border-white/20" },
  { name: "ขายของ", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  { name: "แฟชั่น", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30" },
  { name: "ทั่วไป", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30" },
];

const AI_STYLES = [
  { id: "friendly", label: "เป็นกันเอง", icon: Heart },
  { id: "professional", label: "มืออาชีพ", icon: Megaphone },
  { id: "funny", label: "ตลกขำขัน", icon: Flame },
  { id: "persuasive", label: "ชวนซื้อ", icon: Sparkles },
  { id: "storytelling", label: "เล่าเรื่อง", icon: PenLine },
];

const SPEED_OPTIONS = [
  { id: "slow", label: "ช้า (3-5 นาที)", icon: Snail, color: "text-emerald-400" },
  { id: "medium", label: "กลาง (1-2 นาที)", icon: Gauge, color: "text-amber-400" },
  { id: "fast", label: "เร็ว (30 วินาที)", icon: Zap, color: "text-red-400" },
];

/* ─── Mock Data ─── */
const MOCK_GROUPS: Group[] = [
  { id: 1, name: "ขายของออนไลน์ รวมพ่อค้าแม่ค้า", members: 285000, category: "ขายของ", enabled: true, totalShares: 48, lastShared: "2026-03-28T10:30:00" },
  { id: 2, name: "ตลาดนัดออนไลน์ 24 ชม.", members: 192000, category: "ขายของ", enabled: true, totalShares: 35, lastShared: "2026-03-27T14:00:00" },
  { id: 3, name: "ซื้อขายสินค้ามือสอง ราคาถูก", members: 340000, category: "ขายของ", enabled: true, totalShares: 52, lastShared: "2026-03-28T08:15:00" },
  { id: 4, name: "รวมร้านค้าออนไลน์ ขายดี", members: 156000, category: "ขายของ", enabled: false, totalShares: 12, lastShared: "2026-03-20T16:00:00" },
  { id: 5, name: "แฟชั่นผู้หญิง เสื้อผ้าเกาหลี", members: 420000, category: "แฟชั่น", enabled: true, totalShares: 67, lastShared: "2026-03-28T09:00:00" },
  { id: 6, name: "รองเท้าแฟชั่น ราคาส่ง", members: 98000, category: "แฟชั่น", enabled: true, totalShares: 23, lastShared: "2026-03-26T11:00:00" },
  { id: 7, name: "กระเป๋าแบรนด์เนม สวยหรู", members: 175000, category: "แฟชั่น", enabled: true, totalShares: 41, lastShared: "2026-03-27T20:00:00" },
  { id: 8, name: "เครื่องประดับ แอคเซสเซอรี่", members: 89000, category: "แฟชั่น", enabled: false, totalShares: 8, lastShared: "2026-03-15T13:00:00" },
  { id: 9, name: "Streetwear ไทย ของแท้", members: 67000, category: "แฟชั่น", enabled: true, totalShares: 19, lastShared: "2026-03-25T17:00:00" },
  { id: 10, name: "คุยเรื่องทั่วไป ชิลชิล", members: 510000, category: "ทั่วไป", enabled: true, totalShares: 28, lastShared: "2026-03-28T07:00:00" },
  { id: 11, name: "รีวิวร้านอาหาร ทั่วไทย", members: 380000, category: "ทั่วไป", enabled: true, totalShares: 33, lastShared: "2026-03-27T18:00:00" },
  { id: 12, name: "ท่องเที่ยว เที่ยวไทย", members: 290000, category: "ทั่วไป", enabled: true, totalShares: 15, lastShared: "2026-03-24T10:00:00" },
  { id: 13, name: "สุขภาพดี ชีวิตดี", members: 145000, category: "ทั่วไป", enabled: false, totalShares: 5, lastShared: "2026-03-10T09:00:00" },
  { id: 14, name: "เลี้ยงสัตว์ คนรักหมาแมว", members: 620000, category: "ทั่วไป", enabled: true, totalShares: 22, lastShared: "2026-03-28T06:30:00" },
  { id: 15, name: "ขายของมือสอง กรุงเทพ", members: 230000, category: "ขายของ", enabled: true, totalShares: 39, lastShared: "2026-03-27T21:00:00" },
];

const MOCK_SEARCH_RESULTS: SearchResult[] = [
  { id: 101, name: "ขายเสื้อผ้าออนไลน์ ราคาถูก", members: 315000, description: "กลุ่มสำหรับแม่ค้าพ่อค้าขายเสื้อผ้า ลงขายได้ทุกวัน", status: "none" },
  { id: 102, name: "รวมร้านค้าออนไลน์ สินค้าดี", members: 178000, description: "สินค้าคุณภาพ ราคาโรงงาน ส่งตรงถึงบ้าน", status: "none" },
  { id: 103, name: "ตลาดนัดคนรุ่นใหม่ Gen Z", members: 92000, description: "ขายของสไตล์วัยรุ่น เทรนด์ใหม่ล่าสุด", status: "none" },
  { id: 104, name: "แฟชั่นพลัสไซส์ สวยทุกไซส์", members: 145000, description: "เสื้อผ้าไซส์ใหญ่ สวยมั่นใจ ราคาเบาๆ", status: "none" },
  { id: 105, name: "เครื่องสำอาง บิวตี้ รีวิว", members: 410000, description: "รีวิวเครื่องสำอาง สกินแคร์ เมคอัพ ของแท้", status: "none" },
  { id: 106, name: "อาหารเสริม สุขภาพดี", members: 205000, description: "รีวิวอาหารเสริม วิตามิน สมุนไพร", status: "none" },
  { id: 107, name: "หางาน สมัครงาน ทั่วไทย", members: 890000, description: "รวมงาน ตำแหน่งว่าง ทั่วประเทศ อัพเดททุกวัน", status: "none" },
  { id: 108, name: "ลงทุน หุ้น คริปโต", members: 560000, description: "แชร์ความรู้การลงทุน หุ้นไทย คริปโต ฟอเร็กซ์", status: "none" },
];

const MOCK_RECENT_POSTS = [
  { id: 1, caption: "วันนี้มีโปรพิเศษค่ะ! 💕 ลด 50% ทุกชิ้น", date: "2026-03-28 12:00" },
  { id: 2, caption: "สินค้ามาใหม่ ✨ คอลเลคชั่นหน้าฝน", date: "2026-03-27 19:00" },
  { id: 3, caption: "รีวิวจากลูกค้าจริง ❤️ #รีวิว", date: "2026-03-26 12:00" },
];

/* ─── Helpers ─── */
function formatMembers(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toString();
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "ยังไม่เคย";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชม.ที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

/* ─────────────────────────────────────────────────── */
/*  Main Component                                      */
/* ─────────────────────────────────────────────────── */
export default function GroupsPage() {
  const [activeTab, setActiveTab] = useState<"share" | "mygroups" | "search">("share");

  // ดึง package จาก context — default "vip" (ฟีเจอร์นี้เปิดให้ VIP)
  const customerPackage: "standard" | "business" | "vip" = "vip";

  // VIP Lock — แสดง lock screen ถ้าไม่ใช่ VIP
  if (customerPackage !== "vip") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">👑</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">ฟีเจอร์สำหรับแพ็กเกจ VIP</h2>
          <p className="text-slate-400 mb-6 leading-relaxed">
            การแชร์โพสต์ไปกลุ่ม Facebook อัตโนมัติ เป็นฟีเจอร์พิเศษสำหรับลูกค้าแพ็กเกจ VIP เท่านั้น
          </p>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3 text-slate-300">
              <Share2 size={18} className="text-amber-400" />
              <span>แชร์โพสต์ไปหลายกลุ่มอัตโนมัติ</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Users size={18} className="text-amber-400" />
              <span>จัดการกลุ่ม + จัดหมวดหมู่</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Search size={18} className="text-amber-400" />
              <span>ค้นหา + เข้าร่วมกลุ่มอัตโนมัติ</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Sparkles size={18} className="text-amber-400" />
              <span>AI สร้างแคปชั่นไม่ซ้ำทุกกลุ่ม</span>
            </div>
          </div>
          <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105">
            อัปเกรดเป็น VIP — ฿14,990/เดือน
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "share" as const, label: "แชร์โพสต์ไปกลุ่ม", icon: Share2 },
    { id: "mygroups" as const, label: "กลุ่มของฉัน", icon: Users },
    { id: "search" as const, label: "ค้นหา+เข้าร่วมกลุ่ม", icon: Search },
  ];

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white tracking-tight">👥 แชร์กลุ่ม Facebook</h1>
        <p className="text-slate-400 mt-1">แชร์โพสต์ไปยังกลุ่ม Facebook อัตโนมัติ</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900/50 rounded-2xl border border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "share" && <ShareTab />}
      {activeTab === "mygroups" && <MyGroupsTab />}
      {activeTab === "search" && <SearchTab />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Tab 1: แชร์โพสต์ไปกลุ่ม                            */
/* ═══════════════════════════════════════════════════ */
function ShareTab() {
  const [groups] = useState<Group[]>(MOCK_GROUPS);
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
  const [filterCat, setFilterCat] = useState("ทั้งหมด");

  // Post selection
  const [postMode, setPostMode] = useState<"url" | "recent" | "custom">("recent");
  const [postUrl, setPostUrl] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<number | "">("");
  const [customText, setCustomText] = useState("");

  // Settings
  const [captionMode, setCaptionMode] = useState<"same" | "ai" | "spintax">("same");
  const [aiStyle, setAiStyle] = useState("friendly");
  const [speed, setSpeed] = useState("medium");
  const [caption, setCaption] = useState("");

  // Sharing state
  const [isSharing, setIsSharing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<ShareLog[]>([]);
  const [shareComplete, setShareComplete] = useState(false);

  const enabledGroups = groups.filter((g) => g.enabled);
  const filtered = filterCat === "ทั้งหมด" ? enabledGroups : enabledGroups.filter((g) => g.category === filterCat);

  const toggleGroup = (id: number) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllInCategory = () => {
    const ids = filtered.map((g) => g.id);
    const allSelected = ids.every((id) => selectedGroups.has(id));
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const startSharing = useCallback(() => {
    if (selectedGroups.size === 0) return;
    setIsSharing(true);
    setShareComplete(false);
    setProgress(0);
    setLogs([]);

    const targets = groups.filter((g) => selectedGroups.has(g.id));
    let idx = 0;

    const interval = setInterval(() => {
      if (idx >= targets.length) {
        clearInterval(interval);
        setIsSharing(false);
        setShareComplete(true);
        return;
      }
      const g = targets[idx];
      const success = Math.random() > 0.15;
      setLogs((prev) => [
        ...prev,
        {
          groupId: g.id,
          groupName: g.name,
          status: success ? "success" : "failed",
          time: new Date().toLocaleTimeString("th-TH"),
        },
      ]);
      idx++;
      setProgress(Math.round((idx / targets.length) * 100));
    }, 800);
  }, [selectedGroups, groups]);

  return (
    <div className="space-y-6">
      {/* ── เลือกโพสต์ ── */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Share2 size={20} className="text-indigo-400" />
          เลือกโพสต์ที่จะแชร์
        </h2>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "url" as const, label: "ใส่ URL" },
            { id: "recent" as const, label: "โพสต์ล่าสุด" },
            { id: "custom" as const, label: "พิมพ์เอง" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setPostMode(m.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                postMode === m.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {postMode === "url" && (
          <input
            type="text"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder="https://www.facebook.com/..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}

        {postMode === "recent" && (
          <div className="relative">
            <select
              value={selectedPostId}
              onChange={(e) => setSelectedPostId(e.target.value ? Number(e.target.value) : "")}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="">-- เลือกโพสต์ --</option>
              {MOCK_RECENT_POSTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.caption} ({p.date})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        )}

        {postMode === "custom" && (
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={4}
            placeholder="พิมพ์ข้อความที่ต้องการแชร์..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        )}
      </div>

      {/* ── เลือกกลุ่มเป้าหมาย ── */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-violet-400" />
            เลือกกลุ่มเป้าหมาย
          </h2>
          <span className="text-sm text-indigo-400 font-medium">{selectedGroups.size} กลุ่มที่เลือก</span>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setFilterCat(cat.name)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                filterCat === cat.name
                  ? `${cat.bg} ${cat.color} ${cat.border}`
                  : "bg-slate-800/50 text-slate-500 border-slate-700 hover:text-slate-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
          <button
            onClick={selectAllInCategory}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all"
          >
            {filtered.every((g) => selectedGroups.has(g.id)) && filtered.length > 0 ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
          </button>
        </div>

        {/* Group list */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {filtered.map((group) => {
            const selected = selectedGroups.has(group.id);
            const catInfo = CATEGORIES.find((c) => c.name === group.category);
            return (
              <button
                key={group.id}
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  selected
                    ? "bg-indigo-600/10 border-indigo-500/40"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                {selected ? (
                  <CheckSquare size={20} className="text-indigo-400 shrink-0" />
                ) : (
                  <Square size={20} className="text-slate-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{group.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${catInfo?.bg} ${catInfo?.color}`}>
                      {group.category}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users size={12} /> {formatMembers(group.members)}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(group.lastShared)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ตั้งค่าแชร์ ── */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-amber-400" />
          ตั้งค่าแชร์
        </h2>

        {/* Caption mode */}
        <div className="mb-5">
          <label className="text-sm text-slate-400 mb-2 block">โหมด Caption</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "same" as const, label: "เหมือนกันทุกกลุ่ม" },
              { id: "ai" as const, label: "AI สร้างไม่ซ้ำ" },
              { id: "spintax" as const, label: "Spintax" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setCaptionMode(m.id)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                  captionMode === m.id
                    ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {captionMode === "same" && (
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="พิมพ์ caption ที่จะใช้กับทุกกลุ่ม..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
          />
        )}

        {captionMode === "spintax" && (
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="{สวัสดีค่ะ|หวัดดีค่ะ} วันนี้มี{โปรดีๆ|ข้อเสนอพิเศษ}..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
          />
        )}

        {/* AI Style */}
        {captionMode === "ai" && (
          <div className="mb-5">
            <label className="text-sm text-slate-400 mb-2 block">สไตล์ AI</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {AI_STYLES.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setAiStyle(s.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                      aiStyle === s.id
                        ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <Icon size={18} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Speed */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">ความเร็ว</label>
          <div className="grid grid-cols-3 gap-2">
            {SPEED_OPTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSpeed(s.id)}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-medium transition-all ${
                    speed === s.id
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <Icon size={16} className={speed === s.id ? s.color : ""} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startSharing}
          disabled={isSharing || selectedGroups.size === 0}
          className={`w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-all ${
            isSharing
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : selectedGroups.size === 0
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {isSharing ? (
            <>
              <RefreshCw size={22} className="animate-spin" />
              กำลังแชร์...
            </>
          ) : (
            <>
              <Rocket size={22} />
              เริ่มแชร์ ({selectedGroups.size} กลุ่ม)
            </>
          )}
        </button>
      </div>

      {/* ── Progress & Log ── */}
      {(isSharing || shareComplete) && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            {isSharing ? (
              <RefreshCw size={20} className="text-indigo-400 animate-spin" />
            ) : (
              <CheckCircle size={20} className="text-emerald-400" />
            )}
            {isSharing ? "กำลังแชร์..." : "แชร์เสร็จสิ้น"}
          </h2>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">ความคืบหน้า</span>
              <span className="text-white font-medium">{progress}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{logs.length}</div>
              <div className="text-xs text-slate-400">ทั้งหมด</div>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{logs.filter((l) => l.status === "success").length}</div>
              <div className="text-xs text-emerald-400/70">สำเร็จ</div>
            </div>
            <div className="bg-red-500/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{logs.filter((l) => l.status === "failed").length}</div>
              <div className="text-xs text-red-400/70">ล้มเหลว</div>
            </div>
          </div>

          {/* Logs */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-900/50 text-sm">
                {log.status === "success" ? (
                  <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <XCircle size={14} className="text-red-400 shrink-0" />
                )}
                <span className="text-slate-300 flex-1 truncate">{log.groupName}</span>
                <span className="text-xs text-slate-500">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Tab 2: กลุ่มของฉัน                                 */
/* ═══════════════════════════════════════════════════ */
function MyGroupsTab() {
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCat, setFilterCat] = useState("ทั้งหมด");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("purple");
  const [customCategories, setCustomCategories] = useState<{ name: string; color: string; bg: string; border: string }[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const allCategories = [...CATEGORIES, ...customCategories];
  const CAT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    purple: { bg: "bg-purple-500/10", color: "text-purple-400", border: "border-purple-500/30" },
    orange: { bg: "bg-orange-500/10", color: "text-orange-400", border: "border-orange-500/30" },
    teal: { bg: "bg-teal-500/10", color: "text-teal-400", border: "border-teal-500/30" },
    rose: { bg: "bg-rose-500/10", color: "text-rose-400", border: "border-rose-500/30" },
    lime: { bg: "bg-lime-500/10", color: "text-lime-400", border: "border-lime-500/30" },
  };

  const filtered = groups.filter((g) => {
    const matchCat = filterCat === "ทั้งหมด" || g.category === filterCat;
    const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleEnabled = (id: number) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)));
  };

  const bulkToggle = (enabled: boolean) => {
    setGroups((prev) => prev.map((g) => (selectedIds.has(g.id) ? { ...g, enabled } : g)));
    setSelectedIds(new Set());
  };

  const bulkMoveCategory = (cat: string) => {
    setGroups((prev) => prev.map((g) => (selectedIds.has(g.id) ? { ...g, category: cat } : g)));
    setSelectedIds(new Set());
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const c = CAT_COLORS[newCatColor] || CAT_COLORS.purple;
    setCustomCategories((prev) => [...prev, { name: newCatName.trim(), ...c }]);
    setNewCatName("");
    setShowAddCategory(false);
  };

  const fetchGroups = () => {
    setIsFetching(true);
    setTimeout(() => {
      setIsFetching(false);
    }, 2000);
  };

  const catInfo = (catName: string) => allCategories.find((c) => c.name === catName) || CATEGORIES[0];

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={fetchGroups}
          disabled={isFetching}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          {isFetching ? "กำลังดึง..." : "ดึงกลุ่มจาก Facebook"}
        </button>
        <button
          onClick={() => setShowAddCategory(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium border border-slate-700 hover:bg-slate-700 transition-all"
        >
          <Plus size={16} />
          เพิ่มหมวดหมู่
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหากลุ่ม..."
              className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
            />
          </div>

          {/* View toggle */}
          <div className="flex bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add category modal */}
      {showAddCategory && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">เพิ่มหมวดหมู่ใหม่</h3>
            <button onClick={() => setShowAddCategory(false)} className="text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="ชื่อหมวดหมู่"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="purple">ม่วง</option>
              <option value="orange">ส้ม</option>
              <option value="teal">เขียวน้ำเงิน</option>
              <option value="rose">ชมพู</option>
              <option value="lime">เขียวอ่อน</option>
            </select>
            <button
              onClick={addCategory}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              เพิ่ม
            </button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {allCategories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setFilterCat(cat.name)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filterCat === cat.name
                ? `${cat.bg} ${cat.color} ${cat.border}`
                : "bg-slate-800/50 text-slate-500 border-slate-700 hover:text-slate-300"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-indigo-300 font-medium">{selectedIds.size} กลุ่มที่เลือก</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => bulkToggle(true)} className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors">
              เปิดทั้งหมด
            </button>
            <button onClick={() => bulkToggle(false)} className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 transition-colors">
              ปิดทั้งหมด
            </button>
            {CATEGORIES.filter((c) => c.name !== "ทั้งหมด").map((cat) => (
              <button
                key={cat.name}
                onClick={() => bulkMoveCategory(cat.name)}
                className={`px-3 py-1.5 rounded-lg ${cat.bg} ${cat.color} text-xs font-medium hover:opacity-80 transition-opacity`}
              >
                ย้าย→{cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Groups display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => {
            const ci = catInfo(group.category);
            const selected = selectedIds.has(group.id);
            return (
              <div
                key={group.id}
                className={`bg-gradient-to-br from-slate-900 to-slate-800 border rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-indigo-500/10 ${
                  selected ? "border-indigo-500/40 ring-1 ring-indigo-500/20" : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <button onClick={() => toggleSelect(group.id)}>
                    {selected ? (
                      <CheckSquare size={18} className="text-indigo-400" />
                    ) : (
                      <Square size={18} className="text-slate-600 hover:text-slate-400" />
                    )}
                  </button>
                  <button onClick={() => toggleEnabled(group.id)} className="transition-colors">
                    {group.enabled ? (
                      <ToggleRight size={24} className="text-emerald-400" />
                    ) : (
                      <ToggleLeft size={24} className="text-slate-600" />
                    )}
                  </button>
                </div>
                <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">{group.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ci.bg} ${ci.color}`}>{group.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${group.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-500"}`}>
                    {group.enabled ? "เปิด" : "ปิด"}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Users size={12} /> {formatMembers(group.members)}</span>
                  <span className="flex items-center gap-1"><Share2 size={12} /> แชร์ {group.totalShares} ครั้ง</span>
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  <Clock size={11} className="inline mr-1" />
                  แชร์ล่าสุด: {timeAgo(group.lastShared)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((group) => {
            const ci = catInfo(group.category);
            const selected = selectedIds.has(group.id);
            return (
              <div
                key={group.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  selected ? "bg-indigo-600/10 border-indigo-500/40" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <button onClick={() => toggleSelect(group.id)}>
                  {selected ? (
                    <CheckSquare size={18} className="text-indigo-400" />
                  ) : (
                    <Square size={18} className="text-slate-600" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{group.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ci.bg} ${ci.color}`}>{group.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${group.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-500"}`}>
                      {group.enabled ? "เปิด" : "ปิด"}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                    <span><Users size={12} className="inline mr-1" />{formatMembers(group.members)}</span>
                    <span><Share2 size={12} className="inline mr-1" />แชร์ {group.totalShares} ครั้ง</span>
                    <span><Clock size={12} className="inline mr-1" />{timeAgo(group.lastShared)}</span>
                  </div>
                </div>
                <button onClick={() => toggleEnabled(group.id)} className="transition-colors shrink-0">
                  {group.enabled ? (
                    <ToggleRight size={24} className="text-emerald-400" />
                  ) : (
                    <ToggleLeft size={24} className="text-slate-600" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <Users className="mx-auto text-slate-600 mb-3" size={48} />
          <p className="text-slate-400">ไม่พบกลุ่ม</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Tab 3: ค้นหา+เข้าร่วมกลุ่ม                        */
/* ═══════════════════════════════════════════════════ */
function SearchTab() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [maxJoin, setMaxJoin] = useState(10);
  const [isJoiningAll, setIsJoiningAll] = useState(false);

  const doSearch = () => {
    if (!keyword.trim()) return;
    setIsSearching(true);
    setHasSearched(false);
    setTimeout(() => {
      setResults(
        MOCK_SEARCH_RESULTS.map((r) => ({ ...r, status: "none" as const }))
      );
      setIsSearching(false);
      setHasSearched(true);
    }, 1500);
  };

  const joinGroup = (id: number) => {
    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "pending" as const } : r))
    );
    setTimeout(() => {
      setResults((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          return { ...r, status: Math.random() > 0.1 ? "joined" : "rejected" };
        })
      );
    }, 1500 + Math.random() * 1000);
  };

  const joinAll = () => {
    setIsJoiningAll(true);
    const pending = results.filter((r) => r.status === "none").slice(0, maxJoin);
    pending.forEach((r, i) => {
      setTimeout(() => joinGroup(r.id), i * 600);
    });
    setTimeout(() => setIsJoiningAll(false), pending.length * 600 + 2000);
  };

  const statusBadge = (status: SearchResult["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
            <Clock size={12} />
            รออนุมัติ
          </span>
        );
      case "joined":
        return (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            <CheckCircle size={12} />
            เข้าแล้ว
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">
            <XCircle size={12} />
            ปฏิเสธ
          </span>
        );
      default:
        return null;
    }
  };

  const joinedCount = results.filter((r) => r.status === "joined").length;
  const pendingCount = results.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Globe size={20} className="text-cyan-400" />
          ค้นหากลุ่ม Facebook
        </h2>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="เช่น ขายของออนไลน์, เสื้อผ้า, อาหาร..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={doSearch}
            disabled={isSearching || !keyword.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
            ค้นหา
          </button>
        </div>

        {/* Max join & join all */}
        {hasSearched && results.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">จำนวนสูงสุด:</label>
              <input
                type="number"
                value={maxJoin}
                onChange={(e) => setMaxJoin(Math.max(1, Number(e.target.value)))}
                min={1}
                max={50}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={joinAll}
              disabled={isJoiningAll || results.every((r) => r.status !== "none")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all disabled:opacity-50"
            >
              <UserPlus size={16} />
              {isJoiningAll ? "กำลังเข้าร่วม..." : "เข้าร่วมทั้งหมด"}
            </button>
            <div className="ml-auto flex gap-3 text-xs">
              <span className="text-emerald-400">เข้าแล้ว: {joinedCount}</span>
              <span className="text-amber-400">รอ: {pendingCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isSearching && (
        <div className="text-center py-12">
          <RefreshCw size={32} className="text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">กำลังค้นหากลุ่ม...</p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !isSearching && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium">ผลการค้นหา ({results.length} กลุ่ม)</h3>
          </div>

          {results.map((r) => (
            <div
              key={r.id}
              className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium text-sm">{r.name}</h4>
                    {statusBadge(r.status)}
                  </div>
                  <p className="text-slate-400 text-xs mb-2">{r.description}</p>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Users size={12} /> {formatMembers(r.members)} สมาชิก
                  </span>
                </div>
                {r.status === "none" && (
                  <button
                    onClick={() => joinGroup(r.id)}
                    className="shrink-0 ml-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                  >
                    <UserPlus size={14} />
                    เข้าร่วม
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasSearched && !isSearching && results.length === 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <Search className="mx-auto text-slate-600 mb-3" size={48} />
          <p className="text-slate-400">ไม่พบกลุ่มที่ตรงกับคำค้นหา</p>
        </div>
      )}
    </div>
  );
}
