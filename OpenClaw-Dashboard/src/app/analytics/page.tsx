'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, ThumbsUp, MessageCircle, Share2, Activity, ChevronDown, RefreshCw } from 'lucide-react';

interface PageInfo { id: string; name: string; pageId: string; }

export default function AnalyticsPage() {
  const [stats, setStats] = useState<{ totalPosts: number; totalLikes: number; totalComments: number; totalShares: number } | null>(null);
  const [posts, setPosts] = useState<{ id: string; message: string; created_time: string; engagement: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedPage, setSelectedPage] = useState('main');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPages() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success) {
          const configPages = (data.config.pages || []).map((p: PageInfo & { id?: string }) => ({
            id: p.id || 'main', name: p.name, pageId: p.pageId
          }));
          setPages(configPages);
        }
      } catch {}
    }
    fetchPages();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics?pageId=${selectedPage}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setPosts(data.recentPosts);
      }
    } catch (err) { console.error(err); }
    setIsLoading(false);
  }, [selectedPage]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const currentPageName = pages.find(p => p.id === selectedPage)?.name || selectedPage;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="pb-4 border-b border-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">📊 สถิติเพจ (Analytics)</h1>
            <p className="text-slate-400">ข้อมูล Performance ดึงตรงจาก Facebook Graph API</p>
          </div>
          <div className="flex gap-3">
            {/* Page Selector */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)} title="เลือกเพจ"
                className="flex items-center gap-2.5 bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-white px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all min-w-[180px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                <span className="truncate">{currentPageName}</span>
                <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 border-b border-slate-800">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-1.5">เลือกเพจ</p>
                  </div>
                  <div className="p-1.5 max-h-64 overflow-y-auto">
                    {pages.map(p => (
                      <button key={p.id}
                        onClick={() => { setSelectedPage(p.id); setShowDropdown(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          selectedPage === p.id ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-800 border border-transparent'
                        }`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedPage === p.id ? 'bg-indigo-400' : 'bg-slate-600'}`}></span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedPage === p.id ? 'text-indigo-300' : 'text-white'}`}>{p.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">ID: {p.pageId}</p>
                        </div>
                        {selectedPage === p.id && <span className="text-indigo-400 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={fetchStats} disabled={isLoading} title="รีเฟรช"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-all">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
             <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-32 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="โพสต์ทั้งหมด (30 วัน)" value={stats?.totalPosts || 0} icon={Activity} color="text-indigo-400" bg="bg-indigo-500/10" />
            <StatCard title="ยอดไลก์สะสม" value={stats?.totalLikes || 0} icon={ThumbsUp} color="text-emerald-400" bg="bg-emerald-500/10" />
            <StatCard title="คอมเมนต์สะสม" value={stats?.totalComments || 0} icon={MessageCircle} color="text-blue-400" bg="bg-blue-500/10" />
            <StatCard title="การแชร์สะสม" value={stats?.totalShares || 0} icon={Share2} color="text-amber-400" bg="bg-amber-500/10" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-8">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-400" />
                โพสต์ล่าสุดและ Engagement
              </h2>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {posts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-slate-800/20 transition-colors flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm line-clamp-2 mb-2">{post.message || '(ไม่มีข้อความ)'}</p>
                    <p className="text-xs text-slate-500">{new Date(post.created_time).toLocaleString('th-TH')}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-white">{post.engagement}</span>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Interactions</span>
                    </div>
                    
                    <div className="w-px h-10 bg-slate-800"></div>
                    
                    <div className="flex gap-2">
                      <button title="ดูสถิติ" className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-10 h-10 rounded-xl flex items-center justify-center transition-colors">
                        <TrendingUp size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {posts.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  ไม่มีโพสต์ให้แสดงผล หรือเพจนี้ยังไม่มี Access Token
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string; value: number; icon: React.ComponentType<{ size?: number }>; color: string; bg: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity ${bg}`}></div>
      <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${bg} ${color}`}>
        <Icon size={24} />
      </div>
      <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white">{value.toLocaleString()}</h3>
    </div>
  );
}
