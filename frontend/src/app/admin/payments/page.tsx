"use client";

import { useState, useEffect } from "react";
import { Receipt, Search, DollarSign, TrendingUp, Calendar } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import { apiFetch, formatCurrency, formatDate } from "@/lib/api";

interface Payment {
  id: number;
  customer_name: string;
  amount: number;
  method: string;
  status: string;
  paid_at: string;
}

interface PaymentStats {
  total_revenue: number;
  revenue_this_month: number;
  total_payments: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsData, statsData] = await Promise.all([
        apiFetch<Payment[]>("/admin/payments"),
        apiFetch<PaymentStats>("/admin/payments/stats"),
      ]);
      setPayments(paymentsData);
      setStats(statsData);
    } catch {
      setPayments([]);
      setStats({ total_revenue: 0, revenue_this_month: 0, total_payments: 0 });
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-400",
    pending: "bg-amber-500/10 text-amber-400",
    failed: "bg-red-500/10 text-red-400",
  };

  const statusLabels: Record<string, string> = {
    paid: "ชำระแล้ว",
    pending: "รอชำระ",
    failed: "ล้มเหลว",
  };

  const filtered = payments.filter((p) => p.customer_name.includes(search));

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white tracking-tight">💰 รายรับ</h1>
        <p className="text-slate-400 mt-1">ประวัติการจ่ายเงินทั้งหมด</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="รายได้ทั้งหมด" value={formatCurrency(stats?.total_revenue ?? 0)} icon={DollarSign} color="emerald" />
        <StatCard title="รายได้เดือนนี้" value={formatCurrency(stats?.revenue_this_month ?? 0)} icon={TrendingUp} color="indigo" />
        <StatCard title="จำนวนรายการ" value={stats?.total_payments ?? 0} icon={Calendar} color="blue" />
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
          placeholder="ค้นหาชื่อลูกค้า..."
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">วันที่</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">ลูกค้า</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">จำนวน</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">วิธี</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">ไม่มีข้อมูล</td></tr>
                ) : (
                  filtered.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-400">{formatDate(payment.paid_at)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-white">{payment.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-emerald-400">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{payment.method}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[payment.status] || "bg-slate-800 text-slate-400"}`}>
                          {statusLabels[payment.status] || payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
