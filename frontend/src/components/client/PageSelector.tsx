"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { usePageContext } from "@/lib/PageContext";

export default function PageSelector() {
  const { pages, selectedPageId, setSelectedPageId, selectedPage } = usePageContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-indigo-500/40 transition-all duration-300 group"
      >
        <span className="text-xl">{selectedPage?.emoji}</span>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">
            {selectedPage?.name}
          </p>
          <p className="text-xs text-slate-500">
            {selectedPage?.platform} · {selectedPage?.followers.toLocaleString("th-TH")} ผู้ติดตาม
          </p>
        </div>
        <span className="text-xs mr-1">
          {selectedPage?.status === "active" ? "🟢" : "🟡"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => {
                setSelectedPageId(page.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-200 hover:bg-white/5 ${
                page.id === selectedPageId ? "bg-indigo-500/10" : ""
              }`}
            >
              <span className="text-xl">{page.emoji}</span>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {page.name}
                </p>
                <p className="text-xs text-slate-500">
                  {page.followers.toLocaleString("th-TH")} ผู้ติดตาม
                </p>
              </div>
              <span className="text-xs">
                {page.status === "active" ? "🟢" : "🟡"}
              </span>
              {page.id === selectedPageId && (
                <Check className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
