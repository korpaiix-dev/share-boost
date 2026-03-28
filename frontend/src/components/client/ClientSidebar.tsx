"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Share2,
  MessageCircle,
  MessageSquare,
  BarChart3,
  Wand2,
  Settings,
  LogOut,
  Crown,
  CalendarDays,
} from "lucide-react";
import PageSelector from "./PageSelector";

const navItems = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/dashboard/posts", label: "โพสต์", icon: FileText },
  { href: "/dashboard/groups", label: "แชร์กลุ่ม 👑", icon: Share2 },
  { href: "/dashboard/comments", label: "คอมเม้นท์", icon: MessageCircle },
  { href: "/dashboard/chat", label: "แชท Messenger", icon: MessageSquare },
  { href: "/dashboard/media", label: "โพสต์อัตโนมัติ", icon: Wand2 },
  { href: "/dashboard/reports", label: "สถิติ", icon: BarChart3 },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

interface ClientSidebarProps {
  onNavigate?: () => void;
}

export default function ClientSidebar({ onNavigate }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside className="sticky top-0 left-0 h-screen w-64 flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-white/5">
      {/* Logo */}
      <div className="px-5 pt-5 pb-3">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white text-lg font-bold">P</span>
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent leading-tight">
              PostPilot AI
            </h1>
            <p className="text-[10px] text-slate-500 leading-tight">จัดการเพจอัจฉริยะ</p>
          </div>
        </Link>
      </div>

      {/* Page Selector */}
      <div className="px-3 pb-3">
        <PageSelector />
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/5" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-indigo-300 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] transition-all duration-300 ${
                  isActive
                    ? "text-indigo-400"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-white/5" />

      {/* Package Info */}
      <div className="px-4 py-3">
        <div className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border border-indigo-500/10">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">แพ็กเกจ สแตนดาร์ด</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CalendarDays className="w-3 h-3" />
            <span>หมดอายุ 30 เม.ย. 2569</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
