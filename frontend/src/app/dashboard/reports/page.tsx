"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, Calendar, TrendingUp, Eye, Heart } from "lucide-react";
import SimpleChart from "@/components/admin/SimpleChart";
import { apiFetch, formatNumber } from "@/lib/api";

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
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await apiFetch<Report[]>("/dashboard/reports");
      setReports(data);
      if (data.length > 0) setSelectedReport(data[0]);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white tracking-tight">📈 รายงาน</h1>
        <p className="text-slate-400 mt-1">สรุปผลการดำเนินงานเพจ</p>
      </header>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
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
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span className="text-sm font-medium">{report.period}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{report.start_date} — {report.end_date}</p>
              </button>
            ))}
          </div>

          {/* Report detail */}
          {selectedReport && (
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-2"><Eye size={16} /><span className="text-xs">Reach</span></div>
                  <p className="text-2xl font-bold text-white">{formatNumber(selectedReport.total_reach)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-rose-400 mb-2"><Heart size={16} /><span className="text-xs">Engagement</span></div>
                  <p className="text-2xl font-bold text-white">{formatNumber(selectedReport.total_engagement)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2"><TrendingUp size={16} /><span className="text-xs">โพสต์</span></div>
                  <p className="text-2xl font-bold text-white">{selectedReport.total_posts}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-400 mb-2"><BarChart3 size={16} /><span className="text-xs">คอมเม้น</span></div>
                  <p className="text-2xl font-bold text-white">{selectedReport.total_comments}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-3">สรุปภาพรวม</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedReport.summary}</p>
              </div>

              {/* Top post */}
              {selectedReport.top_post_caption && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
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
