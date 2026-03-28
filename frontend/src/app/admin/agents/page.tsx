"use client";

import { useState, useEffect } from "react";
import AgentStatusCard from "@/components/admin/AgentStatusCard";

interface AgentStatus {
  name: string;
  emoji: string;
  role: string;
  status: "active" | "stopped" | "error";
  model: string;
  last_action?: string;
  tasks_today: number;
}

const defaultAgents: AgentStatus[] = [
  { name: "น้องมิ้นท์", emoji: "🐱", role: "Content Writer — คิดแคปชั่น+โพสต์", status: "active", model: "Gemini 2.5 Flash", last_action: "เขียนแคปชั่นให้ร้าน ABC", tasks_today: 24 },
  { name: "น้องท็อป", emoji: "🐶", role: "Scheduler — จัดตารางโพสต์", status: "active", model: "Gemini 2.5 Flash", last_action: "จัดตารางโพสต์ 3 เพจ", tasks_today: 18 },
  { name: "น้องฟ้า", emoji: "🦊", role: "Analyst — วิเคราะห์สถิติ+รายงาน", status: "active", model: "Gemini 2.5 Flash", last_action: "สรุปสถิติประจำสัปดาห์", tasks_today: 8 },
  { name: "น้องพิ้งค์", emoji: "🐰", role: "Responder — ตอบคอมเม้น", status: "active", model: "Gemini 2.5 Flash", last_action: "ตอบคอมเม้น 15 ข้อความ", tasks_today: 45 },
  { name: "พี่ลีโอ", emoji: "🦁", role: "Manager — ดูแลระบบ+แจ้งเตือน", status: "active", model: "Gemini 2.5 Flash", last_action: "เช็คสถานะระบบ", tasks_today: 12 },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentStatus[]>(defaultAgents);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const toggleAgent = (index: number) => {
    const agent = agents[index];
    const newStatus = agent.status === "active" ? "stopped" : "active";
    setAgents((prev) => prev.map((a, i) => (i === index ? { ...a, status: newStatus } : a)));
  };

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white tracking-tight">🤖 AI เอเจนท์</h1>
        <p className="text-slate-400 mt-1">สถานะ AI ทั้ง 5 ตัว</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl" />
                <div><div className="h-5 bg-slate-800 rounded w-24 mb-2" /><div className="h-3 bg-slate-800 rounded w-32" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <AgentStatusCard
              key={i}
              name={agent.name}
              emoji={agent.emoji}
              role={agent.role}
              status={agent.status}
              model={agent.model}
              lastAction={agent.last_action}
              tasksToday={agent.tasks_today}
              onToggle={() => toggleAgent(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
