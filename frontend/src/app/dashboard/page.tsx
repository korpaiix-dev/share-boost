"use client";

import { usePageContext } from "@/lib/PageContext";
import {
  Eye,
  Heart,
  Users,
  FileText,
  MessageCircle,
  Share2,
  Plus,
  Send,
  Bot,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Zap,
} from "lucide-react";

/* ─── Mock Data ตามเพจ ─── */
const mockDataByPage: Record<
  string,
  {
    reach: number;
    engagement: number;
    followers: number;
    posts: number;
    comments: number;
    shares: number;
    recentActivities: { text: string; time: string; icon: string }[];
  }
> = {
  "page-1": {
    reach: 24500,
    engagement: 1850,
    followers: 12450,
    posts: 18,
    comments: 342,
    shares: 89,
    recentActivities: [
      { text: "โพสต์ 'เมนูใหม่วันนี้' ได้รับ 120 ไลค์", time: "5 นาทีที่แล้ว", icon: "❤️" },
      { text: "AI ตอบคอมเม้นท์ 3 รายการ", time: "12 นาทีที่แล้ว", icon: "🤖" },
      { text: "แชร์ไปกลุ่ม 'คนรักกาแฟ' สำเร็จ", time: "30 นาทีที่แล้ว", icon: "🔗" },
      { text: "มีผู้ติดตามใหม่ +15 คน", time: "1 ชม.ที่แล้ว", icon: "👥" },
      { text: "โพสต์ 'โปรวันศุกร์' ถูกตั้งเวลาแล้ว", time: "2 ชม.ที่แล้ว", icon: "📅" },
    ],
  },
  "page-2": {
    reach: 18200,
    engagement: 2100,
    followers: 8320,
    posts: 12,
    comments: 215,
    shares: 156,
    recentActivities: [
      { text: "โพสต์ผลงานใหม่ได้ 85 ไลค์", time: "10 นาทีที่แล้ว", icon: "🎨" },
      { text: "ลูกค้าส่งข้อความสอบถามราคา", time: "25 นาทีที่แล้ว", icon: "💬" },
      { text: "AI สร้างโพสต์ใหม่พร้อมแล้ว", time: "45 นาทีที่แล้ว", icon: "✨" },
      { text: "แชร์ไปกลุ่ม 'รับออกแบบ' สำเร็จ", time: "1 ชม.ที่แล้ว", icon: "🔗" },
      { text: "มีรีวิวใหม่ 5 ดาว", time: "3 ชม.ที่แล้ว", icon: "⭐" },
    ],
  },
  "page-3": {
    reach: 9800,
    engagement: 620,
    followers: 3150,
    posts: 5,
    comments: 88,
    shares: 34,
    recentActivities: [
      { text: "เพจถูกหยุดพักชั่วคราว", time: "1 วันที่แล้ว", icon: "⏸️" },
      { text: "โพสต์สุดท้ายได้ 45 ไลค์", time: "2 วันที่แล้ว", icon: "❤️" },
      { text: "AI ตอบคอมเม้นท์ 5 รายการ", time: "2 วันที่แล้ว", icon: "🤖" },
    ],
  },
};

const statCards = [
  { key: "reach" as const, label: "การเข้าถึงวันนี้", icon: Eye, color: "indigo" },
  { key: "engagement" as const, label: "การมีส่วนร่วม", icon: Heart, color: "rose" },
  { key: "followers" as const, label: "ผู้ติดตามทั้งหมด", icon: Users, color: "violet" },
  { key: "posts" as const, label: "โพสต์สัปดาห์นี้", icon: FileText, color: "emerald" },
  { key: "comments" as const, label: "คอมเม้นท์วันนี้", icon: MessageCircle, color: "amber" },
  { key: "shares" as const, label: "แชร์วันนี้", icon: Share2, color: "cyan" },
];

const colorMap: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  indigo: { bg: "from-indigo-500/20 to-indigo-600/5", text: "text-indigo-400", glow: "shadow-indigo-500/20", border: "border-indigo-500/20" },
  rose: { bg: "from-rose-500/20 to-rose-600/5", text: "text-rose-400", glow: "shadow-rose-500/20", border: "border-rose-500/20" },
  violet: { bg: "from-violet-500/20 to-violet-600/5", text: "text-violet-400", glow: "shadow-violet-500/20", border: "border-violet-500/20" },
  emerald: { bg: "from-emerald-500/20 to-emerald-600/5", text: "text-emerald-400", glow: "shadow-emerald-500/20", border: "border-emerald-500/20" },
  amber: { bg: "from-amber-500/20 to-amber-600/5", text: "text-amber-400", glow: "shadow-amber-500/20", border: "border-amber-500/20" },
  cyan: { bg: "from-cyan-500/20 to-cyan-600/5", text: "text-cyan-400", glow: "shadow-cyan-500/20", border: "border-cyan-500/20" },
};

export default function DashboardPage() {
  const { selectedPageId, selectedPage } = usePageContext();
  const data = mockDataByPage[selectedPageId] ?? mockDataByPage["page-1"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            ภาพรวม
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {selectedPage?.emoji} {selectedPage?.name} · ข้อมูลวันนี้
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
            อัพเดทล่าสุด: เมื่อสักครู่
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const c = colorMap[card.color];
          const Icon = card.icon;
          const value = data[card.key];

          return (
            <div
              key={card.key}
              className={`relative group p-4 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} shadow-lg ${c.glow} hover:scale-[1.03] transition-all duration-300 overflow-hidden`}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-white/5 ${c.text}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-400 opacity-60" />
                </div>
                <p className="text-2xl font-bold text-slate-100">
                  {value.toLocaleString("th-TH")}
                </p>
                <p className="text-xs text-slate-400 mt-1">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions + AI Agent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-lg">
          <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            การดำเนินการด่วน
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 hover:border-indigo-500/40 hover:scale-[1.02] transition-all duration-300 group">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Plus className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-200">สร้างโพสต์</p>
                <p className="text-[11px] text-slate-500">AI ช่วยเขียน</p>
              </div>
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 hover:border-emerald-500/40 hover:scale-[1.02] transition-all duration-300 group">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Send className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-200">แชร์กลุ่ม</p>
                <p className="text-[11px] text-slate-500">แชร์อัตโนมัติ</p>
              </div>
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 hover:border-rose-500/40 hover:scale-[1.02] transition-all duration-300 group">
              <div className="p-2 rounded-lg bg-rose-500/20">
                <MessageCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-200">ดูคอมเม้น</p>
                <p className="text-[11px] text-slate-500">{data.comments} รายการ</p>
              </div>
            </button>
          </div>
        </div>

        {/* AI Agent Status */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-lg">
          <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-400" />
            AI Agent สถานะ
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="relative">
                <span className="text-xl">🐱</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">มิ้นท์ — ผู้ช่วย AI</p>
                <p className="text-xs text-emerald-400">กำลังตอบคอมเม้นท์...</p>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
              <div className="relative">
                <span className="text-xl">📝</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">ระบบโพสต์อัตโนมัติ</p>
                <p className="text-xs text-indigo-400">โพสต์ถัดไป: 14:00 น.</p>
              </div>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
              <div className="relative">
                <span className="text-xl">🔗</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-slate-500 rounded-full border-2 border-slate-900" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">ระบบแชร์กลุ่ม</p>
                <p className="text-xs text-slate-500">รอคิวถัดไป 15:30 น.</p>
              </div>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-lg">
        <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          กิจกรรมล่าสุด
        </h2>
        <div className="space-y-1">
          {data.recentActivities.map((activity, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200"
            >
              <span className="text-lg">{activity.icon}</span>
              <p className="flex-1 text-sm text-slate-300">{activity.text}</p>
              <span className="text-xs text-slate-500 whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
