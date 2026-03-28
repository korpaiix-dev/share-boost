"use client";

import { Play, Square } from "lucide-react";

interface AgentStatusCardProps {
  name: string;
  emoji: string;
  role: string;
  status: "active" | "stopped" | "error";
  model: string;
  lastAction?: string;
  tasksToday?: number;
  onToggle?: () => void;
}

export default function AgentStatusCard({
  name,
  emoji,
  role,
  status,
  model,
  lastAction,
  tasksToday = 0,
  onToggle,
}: AgentStatusCardProps) {
  const isActive = status === "active";

  return (
    <div
      className={`bg-slate-900 border rounded-2xl p-6 transition-all hover:shadow-xl ${
        isActive
          ? "border-slate-800 hover:border-slate-700"
          : "border-slate-800 opacity-75 grayscale-[30%]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{emoji}</div>
          <div>
            <h3 className="font-bold text-white text-lg">{name}</h3>
            <p className="text-sm text-slate-400">{role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isActive ? "bg-emerald-400 animate-pulse" : status === "error" ? "bg-red-500" : "bg-rose-500"
            }`}
          />
          <span className={`text-xs font-medium ${isActive ? "text-emerald-400" : "text-rose-400"}`}>
            {isActive ? "ทำงาน" : status === "error" ? "ผิดพลาด" : "หยุด"}
          </span>
        </div>
      </div>

      {/* Model info */}
      <div className="bg-slate-950/50 rounded-xl px-4 py-3 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">โมเดล</span>
          <span className="text-slate-300 font-mono">{model}</span>
        </div>
        {lastAction && (
          <div className="flex justify-between text-xs mt-1">
            <span className="text-slate-500">งานล่าสุด</span>
            <span className="text-slate-300">{lastAction}</span>
          </div>
        )}
        <div className="flex justify-between text-xs mt-1">
          <span className="text-slate-500">งานวันนี้</span>
          <span className="text-slate-300">{tasksToday} ครั้ง</span>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
            : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
        }`}
      >
        {isActive ? <Square size={16} /> : <Play size={16} />}
        {isActive ? "หยุด" : "เริ่มทำงาน"}
      </button>
    </div>
  );
}
