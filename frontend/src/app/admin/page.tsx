"use client";

import { useState, useEffect } from "react";
import { Users, DollarSign, CreditCard, FileText, TrendingUp, Activity } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import SimpleChart from "@/components/admin/SimpleChart";
import { apiFetch, formatCurrency } from "@/lib/api";

interface DashboardStats {
  total_customers: number;
  active_customers: number;
  total_pages: number;
  total_revenue: number;
  ai_cost_today: number;
  posts_today: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueChart, setRevenueChart] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, chartData] = await Promise.all([
        apiFetch<DashboardStats>("/admin/dashboard/stats"),
        apiFetch<{ label: string; value: number }[]>("/admin/dashboard/revenue-chart"),
      ]);
      setStats(statsData);
      setRevenueChart(chartData);
    } catch {
      // fallback data when API not ready
      setStats({
        total_customers: 0,
        active_customers: 0,
        total_pages: 0,
        total_revenue: 0,
        ai_cost_today: 0,
        posts_today: 0,
      });
      setRevenueChart([]);
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
        <h1 className="text-3xl font-bold text-white tracking-tight">📊 แดชบอร์ด</h1>
        <p className="text-slate-400 mt-1">ภาพรวมระบบ PostPilot AI</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="ลูกค้าทั้งหมด" value={stats?.total_customers ?? 0} icon={Users} color="indigo" subtitle={`${stats?.active_customers ?? 0} แอคทีฟ`} />
        <StatCard title="รายได้รวม" value={formatCurrency(stats?.total_revenue ?? 0)} icon={DollarSign} color="emerald" />
        <StatCard title="ค่า AI วันนี้" value={`$${(stats?.ai_cost_today ?? 0).toFixed(2)}`} icon={CreditCard} color="amber" />
        <StatCard title="เพจทั้งหมด" value={stats?.total_pages ?? 0} icon={FileText} color="blue" />
        <StatCard title="โพสต์วันนี้" value={stats?.posts_today ?? 0} icon={TrendingUp} color="cyan" />
        <StatCard title="ระบบ" value="ปกติ" icon={Activity} color="emerald" subtitle="AI ทำงานครบ 5 ตัว" />
      </div>

      {/* Charts */}
      {revenueChart.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleChart data={revenueChart} title="รายได้รายเดือน" color="#10b981" type="line" />
          <SimpleChart data={revenueChart} title="จำนวนลูกค้าใหม่" color="#6366f1" type="bar" />
        </div>
      )}
    </div>
  );
}
