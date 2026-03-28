"use client";

import { useState, useEffect } from "react";
import { CreditCard, Search } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import { formatDate } from "@/lib/api";

interface CreditLog {
  id: number;
  page_name: string;
  agent_name: string;
  action: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  created_at: string;
}

interface CreditStats {
  total_cost_today: number;
  total_cost_month: number;
  total_calls_today: number;
  avg_cost_per_call: number;
}

export default function CreditsPage() {
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLogs([
      { id: 1, page_name: "เสื้อผ้าแฟชั่น by เจน", agent_name: "น้องมิ้นท์", action: "เขียนแคปชั่น: photo_001.jpg", model: "gemini-2.5-flash", tokens_in: 850, tokens_out: 120, cost_usd: 0.0002, created_at: "2026-03-28T06:00:00" },
      { id: 2, page_name: "Mr.Bean Coffee", agent_name: "น้องพิ้งค์", action: "ตอบคอมเม้น: สวัสดีค่ะ", model: "gemini-2.5-flash", tokens_in: 320, tokens_out: 65, cost_usd: 0.0001, created_at: "2026-03-28T05:30:00" },
      { id: 3, page_name: "หมอสวยคลินิก", agent_name: "น้องฟ้า", action: "รายงานสถิติประจำวัน", model: "gemini-2.5-flash", tokens_in: 1200, tokens_out: 450, cost_usd: 0.0005, created_at: "2026-03-28T08:00:00" },
      { id: 4, page_name: "เจน Outlet", agent_name: "น้องมิ้นท์", action: "เขียนแคปชั่น: promo_sale.jpg", model: "gemini-2.5-flash", tokens_in: 900, tokens_out: 150, cost_usd: 0.0002, created_at: "2026-03-28T07:00:00" },
      { id: 5, page_name: "BeautyByDoc", agent_name: "น้องพิ้งค์", action: "ตอบคอมเม้น: ราคาเท่าไหร่คะ", model: "gemini-2.5-flash", tokens_in: 280, tokens_out: 85, cost_usd: 0.0001, created_at: "2026-03-28T04:15:00" },
    ]);
    setStats({ total_cost_today: 0.42, total_cost_month: 8.75, total_calls_today: 47, avg_cost_per_call: 0.0002 });
    setLoading(false);
  }, []);

  const agentEmojis: Record<string, string> = {
    "น้องมิ้นท์": "🐱", "น้องท็อป": "🐶", "น้องฟ้า": "🦊", "น้องพิ้งค์": "🐰", "พี่ลีโอ": "🦁",
  };

  const filtered = logs.filter((l) => {
    const matchSearch = l.page_name.includes(search) || l.agent_name.includes(search) || l.action.includes(search);
    const matchAgent = !filterAgent || l.agent_name === filterAgent;
    return matchSearch && matchAgent;
  });

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white tracking-tight">💳 ค่าใช้จ่าย AI</h1>
        <p className="text-slate-400 mt-1">ค่าใช้จ่ายจากการเรียกใช้ AI ทั้งหมด</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="ค่า AI วันนี้" value={`$${(stats?.total_cost_today ?? 0).toFixed(4)}`} icon={CreditCard} color="amber" />
        <StatCard title="ค่า AI เดือนนี้" value={`$${(stats?.total_cost_month ?? 0).toFixed(2)}`} icon={CreditCard} color="rose" />
        <StatCard title="จำนวนครั้งวันนี้" value={stats?.total_calls_today ?? 0} icon={CreditCard} color="blue" />
        <StatCard title="เฉลี่ย/ครั้ง" value={`$${(stats?.avg_cost_per_call ?? 0).toFixed(6)}`} icon={CreditCard} color="indigo" />
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
            placeholder="ค้นหา..."
          />
        </div>
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">ทุก Agent</option>
          <option value="น้องมิ้นท์">🐱 น้องมิ้นท์</option>
          <option value="น้องท็อป">🐶 น้องท็อป</option>
          <option value="น้องฟ้า">🦊 น้องฟ้า</option>
          <option value="น้องพิ้งค์">🐰 น้องพิ้งค์</option>
          <option value="พี่ลีโอ">🦁 พี่ลีโอ</option>
        </select>
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">เวลา</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">เอเจนท์</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">เพจ</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">การกระทำ</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">โมเดล</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">โทเคน</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">ค่าใช้จ่าย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">ไม่มีข้อมูล</td></tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-400">{formatDate(log.created_at)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span>{agentEmojis[log.agent_name] || ""} {log.agent_name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{log.page_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{log.action}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">{log.model}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-300">{(log.tokens_in + log.tokens_out).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-mono text-amber-400">${log.cost_usd.toFixed(6)}</td>
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
