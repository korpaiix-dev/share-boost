"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface LoginResponse {
  access_token: string;
  role: string;
  user_id: number;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // เก็บ token และข้อมูลผู้ใช้ลง localStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem(
        "user",
        JSON.stringify({ id: data.user_id, name: data.name, role: data.role })
      );

      // Redirect ตาม role
      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง";
      if (message === "API not available") {
        setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = (role: "admin" | "customer") => {
    localStorage.setItem("token", "demo-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 0,
        name: role === "admin" ? "Demo Admin" : "Demo Customer",
        role,
      })
    );
    if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Sparkles className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            PostPilot AI
          </h1>
          <p className="text-slate-400 mt-2">
            บริการดูแลเพจ Facebook ด้วย AI ระดับ Premium
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">เข้าสู่ระบบ</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </form>

          {/* Contact */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-400 text-center">
              ยังไม่มีบัญชี? ติดต่อเราเพื่อเริ่มใช้งาน
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          PostPilot AI &copy; 2026 — บริการดูแลเพจ Facebook ด้วย AI
        </p>
      </div>
    </div>
  );
}
