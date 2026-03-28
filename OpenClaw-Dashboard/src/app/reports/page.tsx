'use client';
import { useState, useEffect, useRef } from 'react';
import { Calendar, Users, ThumbsUp, MessageCircle, Share2, ChevronDown, RefreshCw, TrendingUp } from 'lucide-react';

interface PageReport {
  pageId?: string;
  pageName?: string;
  date?: string;
  timestamp?: string;
  insights?: {
    page_name?: string;
    followers?: number;
    fans?: number;
    recent_posts_count?: number;
    total_likes?: number;
    total_comments?: number;
    total_shares?: number;
    top_post?: { id: string; message: string; likes: number; comments: number; shares: number } | null;
  };
  summary?: string;
}

interface DailyReport {
  date?: string;
  timestamp?: string;
  pages?: PageReport[];
}

interface HistoryEntry {
  date: string;
  timestamp: string;
  pages?: PageReport[];
  insights?: Record<string, unknown>;
  summary?: string;
}

export default function ReportsPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pageNames, setPageNames] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState('latest');
  const [selectedPage, setSelectedPage] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDateDropdown(false);
      if (pageRef.current && !pageRef.current.contains(e.target as Node)) setShowPageDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) {
        setReport(data.dailyReport);
        setHistory(data.history || []);
        setPageNames(data.pageNames || {});
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  // Get display report based on selected date
  const displayReport: DailyReport | null = selectedDate === 'latest'
    ? report
    : (() => {
        const entry = history.find(h => h.date === selectedDate);
        if (!entry) return null;
        if (entry.pages) return entry as DailyReport;
        // Old single-page format
        return { date: entry.date, timestamp: entry.timestamp, pages: [entry as unknown as PageReport] };
      })();

  const reportPages = displayReport?.pages || [];
  const configuredPageIds = Object.keys(pageNames);
  const uniqueDates = [...new Set(history.map(h => h.date))].reverse();

  // Determine which pages to display
  const getVisibleReports = (): { pid: string; name: string; report: PageReport | null }[] => {
    if (selectedPage === 'all') {
      return configuredPageIds.map(pid => ({
        pid,
        name: pageNames[pid] || pid,
        report: reportPages.find(p => p.pageId === pid || (p.insights as Record<string, unknown>)?.page_name === pageNames[pid]) || null,
      }));
    }
    const pid = selectedPage;
    return [{
      pid,
      name: pageNames[pid] || pid,
      report: reportPages.find(p => p.pageId === pid || (p.insights as Record<string, unknown>)?.page_name === pageNames[pid]) || null,
    }];
  };

  // If no configured pages, but report exists (legacy), show that directly
  const visibleReports = configuredPageIds.length > 0 ? getVisibleReports() : reportPages.map((p, i) => ({
    pid: p.pageId || `page-${i}`,
    name: p.pageName || (p.insights?.page_name) || 'ไม่ทราบเพจ',
    report: p,
  }));

  const selectedPageName = selectedPage === 'all' ? 'ทุกเพจ' : (pageNames[selectedPage] || selectedPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="pb-4 border-b border-slate-800 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">รายงานน้องฟ้า</h1>
          <p className="text-slate-400">สรุปสถิติเพจรายวัน วิเคราะห์โดย AI อัตโนมัติทุกเช้า 08:00 น.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Page Selector Dropdown */}
          {configuredPageIds.length > 0 && (
            <div ref={pageRef} className="relative">
              <button onClick={() => setShowPageDropdown(!showPageDropdown)}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm text-white hover:border-amber-500/50 transition-all min-w-[140px]">
                <Users size={14} className="text-amber-500" />
                <span className="truncate">{selectedPageName}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ml-auto ${showPageDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showPageDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-1.5 max-h-80 overflow-y-auto">
                    <button onClick={() => { setSelectedPage('all'); setShowPageDropdown(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${selectedPage === 'all' ? 'bg-amber-500/20 text-amber-300' : 'text-white hover:bg-slate-800'}`}>
                      ทุกเพจ
                    </button>
                    {configuredPageIds.map(pid => {
                      const hasReport = reportPages.some(p => p.pageId === pid);
                      return (
                        <button key={pid} onClick={() => { setSelectedPage(pid); setShowPageDropdown(false); }}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between gap-3 ${selectedPage === pid ? 'bg-amber-500/20 text-amber-300' : 'text-white hover:bg-slate-800'}`}>
                          <span className="truncate min-w-0 flex-1">{pageNames[pid]}</span>
                          {hasReport
                            ? <span className="text-emerald-400 text-xs flex-shrink-0">มีรายงาน</span>
                            : <span className="text-slate-600 text-xs flex-shrink-0">ยังไม่มี</span>
                          }
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date Selector */}
          <div ref={dateRef} className="relative">
            <button onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm text-white hover:border-amber-500/50 transition-all">
              <Calendar size={14} className="text-amber-500" />
              <span>{selectedDate === 'latest' ? 'ล่าสุด' : selectedDate}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showDateDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="p-1.5 max-h-64 overflow-y-auto">
                  <button onClick={() => { setSelectedDate('latest'); setShowDateDropdown(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${selectedDate === 'latest' ? 'bg-amber-500/20 text-amber-300' : 'text-white hover:bg-slate-800'}`}>
                    📊 ล่าสุด
                  </button>
                  {uniqueDates.map(d => (
                    <button key={d} onClick={() => { setSelectedDate(d); setShowDateDropdown(false); }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${selectedDate === d ? 'bg-amber-500/20 text-amber-300' : 'text-white hover:bg-slate-800'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={fetchReports} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:border-amber-500/50 transition-all text-slate-400 hover:text-amber-400" title="รีเฟรช">
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-amber-500 animate-spin"></div>
          <p className="font-medium">กำลังโหลดรายงาน...</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          {visibleReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3 bg-slate-900/50 rounded-2xl border border-slate-800">
              <p className="font-medium text-lg mb-2">ยังไม่มีรายงานจากน้องฟ้า</p>
              <p className="text-sm">น้องฟ้ารันอัตโนมัติทุกวัน 08:00 น. รายงานจะแสดงที่นี่หลังจากรันสำเร็จครับ</p>
            </div>
          ) : (
            visibleReports.map(({ pid, name, report: pageReport }) => {
              if (!pageReport) {
                return (
                  <div key={pid} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mx-auto mb-4">📄</div>
                    <p className="text-slate-300 font-medium text-lg mb-1">{name}</p>
                    <p className="text-slate-500 text-sm">ยังไม่มีรายงานสำหรับเพจนี้ — น้องฟ้าจะวิเคราะห์ให้เมื่อมีข้อมูลครับ</p>
                  </div>
                );
              }

              return (
                <div key={pid} className="bg-gradient-to-br from-amber-950/20 to-slate-900 border border-amber-500/20 rounded-2xl overflow-hidden shadow-lg shadow-amber-900/5 animate-in fade-in zoom-in-95 duration-300">
                  
                  <div className="px-6 py-5 border-b border-amber-500/10 bg-slate-900/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl shadow-inner border border-amber-500/20">📊</div>
                      <div>
                        <h2 className="text-white font-bold text-xl">{pageReport.pageName || pageReport.insights?.page_name || name}</h2>
                        <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                          <Calendar size={14} className="text-amber-500/70" />
                          {pageReport.date || displayReport?.date || 'ไม่ทราบวันที่'}
                          {(pageReport.timestamp || displayReport?.timestamp) && (
                            <span className="text-slate-500">• {new Date(pageReport.timestamp || displayReport?.timestamp || '').toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-8">
                    {/* AI Summary */}
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur opacity-30"></div>
                      <div className="relative bg-slate-900/80 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 shadow-inner">
                        <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center gap-2 border-b border-amber-500/20 pb-3">
                          <TrendingUp size={18} />
                          บทวิเคราะห์จากน้องฟ้า
                        </h3>
                        <div className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap">
                          {pageReport.summary || 'ไม่มีข้อมูลสรุป'}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pageReport.insights && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <Users size={16} className="text-slate-500" />
                            ภาพรวมสถิติ
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center">
                              <Users size={20} className="text-amber-400 mb-2 opacity-80" />
                              <p className="text-white font-bold text-2xl mb-1">{pageReport.insights.followers?.toLocaleString() || 0}</p>
                              <p className="text-slate-500 text-xs uppercase tracking-wider">ผู้ติดตามทั้งหมด</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center">
                              <ThumbsUp size={20} className="text-emerald-400 mb-2 opacity-80" />
                              <p className="text-emerald-400 font-bold text-2xl mb-1">{pageReport.insights.total_likes?.toLocaleString() || 0}</p>
                              <p className="text-slate-500 text-xs uppercase tracking-wider">ยอดไลก์สะสม</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center">
                              <MessageCircle size={20} className="text-blue-400 mb-2 opacity-80" />
                              <p className="text-blue-400 font-bold text-2xl mb-1">{pageReport.insights.total_comments?.toLocaleString() || 0}</p>
                              <p className="text-slate-500 text-xs uppercase tracking-wider">คอมเมนต์สะสม</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center">
                              <Share2 size={20} className="text-pink-400 mb-2 opacity-80" />
                              <p className="text-pink-400 font-bold text-2xl mb-1">{pageReport.insights.total_shares?.toLocaleString() || 0}</p>
                              <p className="text-slate-500 text-xs uppercase tracking-wider">แชร์สะสม</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {pageReport.insights?.top_post && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            🌟 โพสต์ยอดฮิตประจำวัน
                          </h3>
                          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5 h-[calc(100%-2rem)] flex flex-col">
                            <div className="flex-1">
                              <p className="text-slate-300 text-[15px] leading-relaxed line-clamp-6 mb-4">
                                &quot;{pageReport.insights.top_post.message || '(ไม่มีข้อความ)'}&quot;
                              </p>
                            </div>
                            <div className="flex gap-4 text-sm text-slate-400 bg-slate-900/50 p-3 rounded-lg mt-auto justify-center border border-slate-700/50">
                              <span className="flex items-center gap-1.5"><ThumbsUp size={14} className="text-emerald-500" /> {pageReport.insights.top_post.likes}</span>
                              <span className="flex items-center gap-1.5"><MessageCircle size={14} className="text-blue-500" /> {pageReport.insights.top_post.comments}</span>
                              <span className="flex items-center gap-1.5"><Share2 size={14} className="text-pink-500" /> {pageReport.insights.top_post.shares}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
