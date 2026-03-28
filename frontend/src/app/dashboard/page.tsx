"use client";

import { useState, useEffect } from "react";
import { Eye, Heart, MessageCircle, Share2, TrendingUp, FileText } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import { apiFetch, formatNumber, formatDate } from "@/lib/api";

interface DashboardData {
  page_name: string;
  reach_today: number;
  engagement_today: number;
  followers: number;
  posts_this_week: number;
  comments_today: number;
  shares_today: number;
}

interface RecentPost {
  id: number;
  caption: string;
  media_type: string;
  status: string;
  posted_at: string;
  likes: number;
  comments: number;
  shares: number;
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashData, postsData] = await Promise.all([
        apiFetch<DashboardData>("/dashboard/overview"),
        apiFetch<RecentPost[]>("/dashboard/posts/recent"),
      ]);
      setData(dashData);
      setRecentPosts(postsData);
    } catch {
      setData({
        page_name: "-",
        reach_today: 0,
        engagement_today: 0,
        followers: 0,
        posts_this_week: 0,
        comments_today: 0,
        shares_today: 0,
      });
      setRecentPosts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="w-12 h-12 bg-slate-800 rounded-xl mb-4" />
              <div className="h-4 bg-slate-800 rounded w-20 mb-2" />
              <div className="h-8 bg-slate-800 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white tracking-tight">📊 ภาพรวม</h1>
        <p className="text-slate-400 mt-1">{data?.page_name || "เพจของคุณ"}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Reach วันนี้" value={formatNumber(data?.reach_today ?? 0)} icon={Eye} color="blue" />
        <StatCard title="Engagement วันนี้" value={formatNumber(data?.engagement_today ?? 0)} icon={Heart} color="rose" />
        <StatCard title="ผู้ติดตาม" value={formatNumber(data?.followers ?? 0)} icon={TrendingUp} color="indigo" />
        <StatCard title="โพสต์สัปดาห์นี้" value={data?.posts_this_week ?? 0} icon={FileText} color="emerald" />
        <StatCard title="คอมเม้นท์วันนี้" value={data?.comments_today ?? 0} icon={MessageCircle} color="amber" />
        <StatCard title="แชร์วันนี้" value={data?.shares_today ?? 0} icon={Share2} color="cyan" />
      </div>

      {/* Recent Posts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">โพสต์ล่าสุด</h2>
        {recentPosts.length === 0 ? (
          <p className="text-slate-500 text-sm">ยังไม่มีโพสต์</p>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 line-clamp-2">{post.caption}</p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>{formatDate(post.posted_at)}</span>
                      <span className={`px-2 py-0.5 rounded ${post.status === "posted" ? "bg-emerald-500/10 text-emerald-400" : post.status === "queued" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                        {post.status === "posted" ? "โพสต์แล้ว" : post.status === "queued" ? "รอโพสต์" : "ล้มเหลว"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 ml-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comments}</span>
                    <span className="flex items-center gap-1"><Share2 size={12} /> {post.shares}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
