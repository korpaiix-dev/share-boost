"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Save, X, Globe, Clock } from "lucide-react";
import { apiFetch, formatDate } from "@/lib/api";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  package: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface Page {
  id: number;
  page_name: string;
  fb_page_id: string;
  caption_style: string;
  auto_post: boolean;
  auto_comment: boolean;
  auto_chat: boolean;
  status: string;
  post_times: string[];
}

const mockCustomer: Customer = {
  id: 1,
  name: "ร้านเสื้อผ้าพี่เจน",
  email: "jen@gmail.com",
  phone: "081-234-5678",
  package: "business",
  status: "active",
  created_at: "2026-01-15T00:00:00",
  expires_at: "2026-04-15T00:00:00",
};

const mockPages: Page[] = [
  { id: 1, page_name: "เสื้อผ้าแฟชั่น by เจน", fb_page_id: "123456", caption_style: "sell", auto_post: true, auto_comment: true, auto_chat: true, status: "active", post_times: ["12:00", "19:00"] },
  { id: 2, page_name: "เจน Outlet", fb_page_id: "123457", caption_style: "cute", auto_post: true, auto_comment: true, auto_chat: true, status: "active", post_times: ["12:00", "19:00"] },
];

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<Customer & { pages_count?: number }>(`/admin/customers/${params.id}`);
        setCustomer(data);
        setEditData(data);

        // ดึงเพจของลูกค้า
        try {
          const pagesData = await apiFetch<Page[]>(`/admin/pages?customer_id=${params.id}`);
          setPages(pagesData);
        } catch {
          setPages([]);
        }
      } catch {
        // Fallback mock
        const mock = { ...mockCustomer, id: Number(params.id) };
        setCustomer(mock);
        setEditData(mock);
        setPages(mockPages);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const handleSave = async () => {
    try {
      const updated = await apiFetch<Customer>(`/admin/customers/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          package: editData.package,
        }),
      });
      setCustomer(updated);
      setEditData(updated);
    } catch {
      // Fallback local
      setCustomer({ ...customer!, ...editData } as Customer);
    }
    setEditing(false);
  };

  const styleLabels: Record<string, string> = {
    sexy: "เซ็กซี่", cute: "น่ารัก", funny: "ตลก", sell: "ขายของ", classy: "หรูหรา",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-48 mb-4" />
          <div className="h-4 bg-slate-800 rounded w-64" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">ไม่พบข้อมูลลูกค้า</p>
        <button onClick={() => router.push("/admin/customers")} className="text-indigo-400 mt-2 hover:underline">กลับ</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => router.push("/admin/customers")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight">{customer.name}</h1>
          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${customer.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {customer.status === "active" ? "แอคทีฟ" : "ระงับ"}
          </span>
        </div>
        <p className="text-slate-400 ml-9">{customer.email}</p>
      </header>

      {/* Customer Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">ข้อมูลลูกค้า</h2>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"><X size={18} /></button>
              <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Save size={16} />บันทึก</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"><Edit2 size={18} /></button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500">ชื่อ</label>
            {editing ? (
              <input value={editData.name || ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2 px-3 text-sm mt-1" />
            ) : (
              <p className="text-white mt-1">{customer.name}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500">อีเมล</label>
            {editing ? (
              <input value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2 px-3 text-sm mt-1" />
            ) : (
              <p className="text-white mt-1">{customer.email}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500">เบอร์โทร</label>
            <p className="text-white mt-1">{customer.phone}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500">แพ็คเกจ</label>
            {editing ? (
              <select value={editData.package || ""} onChange={(e) => setEditData({ ...editData, package: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2 px-3 text-sm mt-1">
                <option value="standard">Standard</option>
                <option value="business">Business</option>
                <option value="vip">VIP</option>
              </select>
            ) : (
              <p className="text-white mt-1 capitalize">{customer.package}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500">สมัครเมื่อ</label>
            <p className="text-white mt-1">{formatDate(customer.created_at)}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500">หมดอายุ</label>
            <p className="text-white mt-1">{customer.expires_at ? formatDate(customer.expires_at) : "-"}</p>
          </div>
        </div>
      </div>

      {/* Pages */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">เพจ ({pages.length})</h2>
        {pages.length === 0 ? (
          <p className="text-slate-500 text-sm">ยังไม่มีเพจ</p>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => (
              <div key={page.id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-blue-400" />
                      <h3 className="font-medium text-white">{page.page_name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${page.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                        {page.status === "active" ? "เปิดใช้" : "หยุด"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">FB ID: {page.fb_page_id}</p>
                  </div>
                  <span className="text-xs text-slate-400">{styleLabels[page.caption_style] || page.caption_style}</span>
                </div>
                <div className="flex gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-slate-500" />
                    <span className="text-slate-400">{page.post_times?.join(", ") || "-"}</span>
                  </div>
                  <span className={page.auto_post ? "text-emerald-400" : "text-slate-500"}>โพสต์อัตโนมัติ {page.auto_post ? "เปิด" : "ปิด"}</span>
                  <span className={page.auto_comment ? "text-emerald-400" : "text-slate-500"}>ตอบคอมเม้น {page.auto_comment ? "เปิด" : "ปิด"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
