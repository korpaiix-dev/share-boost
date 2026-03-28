import Link from 'next/link';
import { Home, Calendar, BarChart2, Image as ImageIcon, Settings, Wallet, FileText } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { name: 'Agent Office', icon: Home, path: '/' },
    { name: 'ตารางโพสต์', icon: Calendar, path: '/schedule' },
    { name: 'สถิติเพจ', icon: BarChart2, path: '/analytics' },
    { name: 'รายงานน้องฟ้า', icon: FileText, path: '/reports' },
    { name: 'คลังภาพ/วิดีโอ', icon: ImageIcon, path: '/media' },
    { name: 'บัญชีเครดิต', icon: Wallet, path: '/credits' },
    { name: 'การตั้งค่า', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full sticky top-0 left-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
          <span>🦞</span> OpenClaw Dash
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Gateway Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm text-emerald-400 font-medium">Online (Port 18789)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
