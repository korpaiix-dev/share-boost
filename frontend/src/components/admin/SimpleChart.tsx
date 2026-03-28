"use client";

interface ChartData {
  label: string;
  value: number;
}

interface SimpleChartProps {
  data: ChartData[];
  title: string;
  color?: string;
  type?: "bar" | "line";
}

export default function SimpleChart({ data, title, color = "#6366f1", type = "bar" }: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {type === "bar" ? (
          data.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-16 shrink-0 text-right">{d.label}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(d.value / maxValue) * 100}%`,
                    backgroundColor: color,
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-white w-16">{d.value.toLocaleString()}</span>
            </div>
          ))
        ) : (
          <div className="h-48 flex items-end gap-1">
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-slate-400">{d.value.toLocaleString()}</span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${(d.value / maxValue) * 160}px`,
                    backgroundColor: color,
                    opacity: 0.7,
                  }}
                />
                <span className="text-xs text-slate-500">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
