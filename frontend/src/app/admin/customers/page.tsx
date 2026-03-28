"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, UserCheck, UserX } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import { apiFetch, formatDate } from "@/lib/api";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  package: string;
  status: string;
  created_at: string;
  pages_count: number;
}

const packageLabels: Record<string, string> = {
  standard: "Standard",
  business: "Business",
  vip: "VIP",
};

const packageColors: Record<string, string> = {
  standard: "bg-blue-500/10 text-blue-400",
  business: "bg-indigo-500/10 text-indigo-400",
  vip: "bg-amber-500/10 text-amber-400",
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", package: "standard", password: "" });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await apiFetch<Customer[]>("/admin/customers");
      setCustomers(data);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await apiFetch("/admin/customers", {
        method: "POST",
        body: JSON.stringify(newCustomer),
      });
      setShowAddModal(false);
      setNewCustomer({ name: "", email: "", phone: "", package: "standard", password: "" });
      loadCustomers();
    } catch {
      alert("เกิดข้อผิดพลาดในการเพิ่มลูกค้า");
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await apiFetch(`/admin/customers/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      loadCustomers();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const filtered = customers.filter(
    (c) => c.name.includes(search) || c.email.includes(search) || c.phone.includes(search)
  );

  const columns = [
    { key: "name", label: "ชื่อ", render: (c: Customer) => <span className="font-medium text-white">{c.name}</span> },
    { key: "email", label: "อีเมล" },
    { key: "phone", label: "โทร" },
    {
      key: "package",
      label: "แพ็คเกจ",
      render: (c: Customer) => (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${packageColors[c.package] || "bg-slate-800 text-slate-400"}`}>
          {packageLabels[c.package] || c.package}
        </span>
      ),
    },
    {
      key: "status",
      label: "สถานะ",
      render: (c: Customer) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
          <span className={c.status === "active" ? "text-emerald-400" : "text-red-400"}>
            {c.status === "active" ? "แอคทีฟ" : "ระงับ"}
          </span>
        </div>
      ),
    },
    { key: "pages_count", label: "เพจ" },
    { key: "created_at", label: "สมัครเมื่อ", render: (c: Customer) => formatDate(c.created_at) },
    {
      key: "actions",
      label: "",
      render: (c: Customer) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleStatus(c.id, c.status); }}
          className={`p-2 rounded-lg transition-colors ${
            c.status === "active"
              ? "hover:bg-red-500/10 text-red-400"
              : "hover:bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {c.status === "active" ? <UserX size={16} /> : <UserCheck size={16} />}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">👥 จัดการลูกค้า</h1>
            <p className="text-slate-400 mt-1">ลูกค้าทั้งหมด {customers.length} ราย</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <Plus size={16} />
            เพิ่มลูกค้า
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
          placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
        />
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-3">กำลังโหลด...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
          emptyMessage="ยังไม่มีลูกค้า"
        />
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">เพิ่มลูกค้าใหม่</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ชื่อ</label>
                <input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">อีเมล</label>
                <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">เบอร์โทร</label>
                <input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">รหัสผ่าน</label>
                <input type="password" value={newCustomer.password} onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">แพ็คเกจ</label>
                <select value={newCustomer.package} onChange={(e) => setNewCustomer({ ...newCustomer, package: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="standard">Standard — ฿5,990/เดือน</option>
                  <option value="business">Business — ฿9,990/เดือน</option>
                  <option value="vip">VIP — ฿14,990/เดือน</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors">ยกเลิก</button>
                <button onClick={handleAdd} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">เพิ่มลูกค้า</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
