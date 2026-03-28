import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "indigo" | "emerald" | "blue" | "amber" | "rose" | "cyan";
  subtitle?: string;
}

const colorMap = {
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", glow: "bg-indigo-500/10" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "bg-emerald-500/10" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", glow: "bg-blue-500/10" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", glow: "bg-amber-500/10" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-400", glow: "bg-rose-500/10" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", glow: "bg-cyan-500/10" },
};

export default function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity ${c.glow}`} />
      <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${c.bg} ${c.text}`}>
        <Icon size={24} />
      </div>
      <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white">{value}</h3>
      {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}
