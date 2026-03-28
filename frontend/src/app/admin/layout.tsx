"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Menu, X } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 text-white hover:bg-white/20 transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 z-10 lg:hidden p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        <AdminSidebar />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 pt-16 lg:p-6 lg:pt-6 xl:p-8">{children}</div>
      </main>
    </div>
  );
}
