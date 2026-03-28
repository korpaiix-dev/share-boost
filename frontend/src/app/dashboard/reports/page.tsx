"use client";

import { useState, useEffect } from "react";
import { BarChart3, Calendar, TrendingUp, Eye, Heart } from "lucide-react";
import { formatNumber } from "@/lib/api";

interface Report {
  id: number;
  period: string;
  start_date: string;
  end_date: string;
  total_reach: number;
  total_engagement: number;
  total_posts: number;
  total_comments: number;
  top_post_caption: string;
  summary: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setReports([
      { id: 1, period: "weekly", start_date: "2026-03-22", end_date: "2026-03-28", total_reach: 32400, total_engagement: 1520, total_posts: 7, total_comments: 185, top_post_caption: "โปรพิเศษลด 50% ทุกชิ้น!", summary: "📊 สัปดาห์นี้ Reach 32,400 (+15%) | Engagement 1,520 (+22%)\n🏆 โพสต์ยอดนิยม: โปรพิเศษลด 50%\n💡 แนะนำ: โพสต์ช่วง 18:00-20:00 ได้ engagement สูงสุด" },
      { id: 2, period: "weekly", start_date: "2026-03-15", end_date: "2026-03-21", total_reach: 28200, total_engagement: 1245, total_posts: 7, total_comments: 142, top_post_caption: "สินค้ามาใหม่คอลเลคชั่นหน้าฝน", summary: "📊 สัปดาห์นี้ Reach 28,200 | Engagement 1,245\n🏆 โพสต์ยอดนิยม: คอลเลคชั่นหน้าฝน\n💡 แนะนำ: วิดีโอได้ engagement ดีกว่ารูปเดี่ยว 40%" },
    ]);
    setLoading(false);
  }, []);

  // Mock data already loaded in useEffect

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <h1 className="text-3xl font-bold text-white tracking-tight">📈 รายงาน</h1>
        <p className="text-slate-400 mt-1">สรุปผลการดำเนินงานเพจ</p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-32 mb-3" />
              <div className="h-4 bg-white/10 rounded w-full mb-2" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <BarChart3 className="mx-auto text-slate-600 mb-3" size={48} />
          <p className="text-slate-400">ยังไม่มีรายงาน</p>
          <p className="text-slate-500 text-sm mt-1">รายงานจะถูกสร้างอัตโนมัติทุกสัปดาห์</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report list */}
          <div className="lg:col-span-1 space-y-2">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedReport?.id === report.id
                    ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span className="text-sm font-medium">{report.period === "weekly" ? "รายสัปดาห์" : report.period === "monthly" ? "รายเดือน" : report.period}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{report.start_date} — {report.end_date}</p>
              </button>
            ))}
          </div>

          {/* Report detail */}
          {selectedReport && (
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-2"><Eye size={16} /><span className="text-xs">การเข้าถึง</span></div>
                  <p className="text-2xl font-bold text-white">{formatNumber(selectedReport.total_reach)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-rose-400 mb-2"><Heart size={16} /><span className="text-xs">การมีส่วนร่วม</span></div>
                  <p className="text-2xl font-bold text-white">{formatNumber(selectedReport.total_engagement)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2"><TrendingUp size={16} /><span className="text-xs">โพสต์</span></div>
                  <p className="text-2xl font-bold text-white">{selectedReport.total_posts}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-400 mb-2"><BarChart3 size={16} /><span className="text-xs">คอมเม้น</span></div>
                  <p className="text-2xl font-bold text-white">{selectedReport.total_comments}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-3">สรุปภาพรวม</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedReport.summary}</p>
              </div>

              {/* Top post */}
              {selectedReport.top_post_caption && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-3">โพสต์ยอดนิยม</h3>
                  <p className="text-sm text-slate-300">{selectedReport.top_post_caption}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
