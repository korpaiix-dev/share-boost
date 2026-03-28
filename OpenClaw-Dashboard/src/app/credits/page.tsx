'use client';
import { useState, useEffect } from 'react';
import { Wallet, Cpu, Zap, DollarSign, Clock, Globe, ChevronDown } from 'lucide-react';

interface CreditEntry {
  timestamp: string;
  agent: string;
  action: string;
  model: string;
  pageId?: string;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
}

interface AgentSummary { totalCost: number; totalCalls: number; totalTokens: number; }
interface PageSummary { pageId: string; pageName: string; totalCost: number; totalCalls: number; totalTokens: number; }

const AGENT_NAMES: Record<string, string> = {
  'agent-mint': '✍️ น้องมิ้นท์ (Content Writer)',
  'agent-top': '⏱️ น้องท็อป (Scheduler)',
  'agent-fah': '🦊 น้องฟ้า (Analyst)',
  'agent-pink': '🐰 น้องพิ้งค์ (Responder)',
  'agent-leo': '🦁 พี่ลีโอ (Manager)',
  'agent-chat': '💬 แชท AI',
};

export default function CreditsPage() {
  const [logs, setLogs] = useState<CreditEntry[]>([]);
  const [agentSummary, setAgentSummary] = useState<Record<string, AgentSummary>>({});
  const [pageSummary, setPageSummary] = useState<Record<string, PageSummary>>({});
  const [pageNames, setPageNames] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState<number | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPage, setFilterPage] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch('/api/credits');
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
          setAgentSummary(data.agentSummary || {});
          setPageSummary(data.pageSummary || {});
          setPageNames(data.pageNames || {});
          setBalance(data.balance);
          setTotalSpent(data.totalSpent || 0);
        }
      } catch (err) { console.error(err); }
      setIsLoading(false);
    }
    fetchCredits();
  }, []);

  const formatCost = (usd: number) => usd === 0 ? '$0.000000' : usd < 0.000001 ? '< $0.000001' : `$${usd.toFixed(6)}`;
  const formatThb = (usd: number) => { const thb = usd * 34; return thb === 0 ? '฿0.00' : thb < 0.01 ? '< ฿0.01' : `฿${thb.toFixed(2)}`; };
  const formatTime = (ts: string) => new Date(ts).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  const filteredLogs = filterPage === 'all' ? logs : logs.filter(l => (l.pageId || 'unknown') === filterPage);
  const pageList = Object.values(pageSummary).sort((a, b) => b.totalCost - a.totalCost);

  // Color palette for pages
  const PAGE_COLORS = ['from-violet-600/30 to-violet-800/10 border-violet-500/20', 'from-cyan-600/30 to-cyan-800/10 border-cyan-500/20', 'from-amber-600/30 to-amber-800/10 border-amber-500/20', 'from-pink-600/30 to-pink-800/10 border-pink-500/20', 'from-lime-600/30 to-lime-800/10 border-lime-500/20'];
  const PAGE_TEXT_COLORS = ['text-violet-300', 'text-cyan-300', 'text-amber-300', 'text-pink-300', 'text-lime-300'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">บัญชีเครดิต</h1>
        <p className="text-slate-400">ติดตามค่าใช้จ่ายแยกตามเพจ เพื่อเรียกเก็บเงินได้ถูกต้อง</p>
      </header>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Wallet size={20} className="text-emerald-400" />
            <span className="text-emerald-300 text-sm font-bold uppercase tracking-wider">เครดิตคงเหลือ</span>
          </div>
          <p className="text-3xl font-bold text-white">{isLoading ? '...' : balance !== null ? `฿${(balance * 34).toFixed(2)}` : 'N/A'}</p>
          <p className="text-emerald-400/60 text-xs mt-1">{balance !== null ? `≈ $${balance.toFixed(4)} USD` : ''}</p>
        </div>

        <div className="bg-gradient-to-br from-rose-900/40 to-rose-800/20 border border-rose-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign size={20} className="text-rose-400" />
            <span className="text-rose-300 text-sm font-bold uppercase tracking-wider">ใช้ไปทั้งหมด</span>
          </div>
          <p className="text-3xl font-bold text-white">{isLoading ? '...' : formatThb(totalSpent)}</p>
          <p className="text-rose-400/60 text-xs mt-1">{isLoading ? '' : formatCost(totalSpent)}</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap size={20} className="text-indigo-400" />
            <span className="text-indigo-300 text-sm font-bold uppercase tracking-wider">จำนวนครั้ง API</span>
          </div>
          <p className="text-3xl font-bold text-white">{isLoading ? '...' : logs.length}</p>
          <p className="text-indigo-400/60 text-xs mt-1">ครั้ง</p>
        </div>
      </div>

      {/* Per-Page Cost Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe size={20} className="text-violet-400" />
          💳 ค่าใช้จ่ายแยกตามเพจ
        </h2>
        {pageList.length === 0 && !isLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
            ยังไม่มีข้อมูล — เมื่อโพสต์จากเพจไหน ค่าใช้จ่ายจะแยกแสดงเป็นรายเพจ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pageList.map((page, idx) => (
              <div key={page.pageId} className={`bg-gradient-to-br ${PAGE_COLORS[idx % PAGE_COLORS.length]} border rounded-2xl p-5 hover:scale-[1.01] transition-all`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '📄'}
                    </div>
                    <div>
                      <p className={`font-bold ${PAGE_TEXT_COLORS[idx % PAGE_TEXT_COLORS.length]}`}>{page.pageName}</p>
                      <p className="text-[10px] text-slate-500">ID: {page.pageId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{formatThb(page.totalCost)}</p>
                    <p className="text-slate-500 text-[10px]">{formatCost(page.totalCost)}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 pt-3 border-t border-white/5">
                  <span>🔁 {page.totalCalls} ครั้ง</span>
                  <span>🪙 {page.totalTokens.toLocaleString()} tokens</span>
                  <span>📊 {totalSpent > 0 ? ((page.totalCost / totalSpent) * 100).toFixed(1) : 0}% ของทั้งหมด</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Summary */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu size={20} className="text-indigo-400" />
          ค่าใช้จ่ายแยกตาม Agent
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(agentSummary).map(([agentId, summary]) => (
            <div key={agentId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <p className="text-sm text-slate-300 font-medium mb-3">{AGENT_NAMES[agentId] || agentId}</p>
              <p className="text-xl font-bold text-white">{formatThb(summary.totalCost)}</p>
              <p className="text-slate-500 text-xs mt-1">{formatCost(summary.totalCost)}</p>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-500">
                <span>🔁 {summary.totalCalls} ครั้ง</span>
                <span>🪙 {summary.totalTokens.toLocaleString()} tokens</span>
              </div>
            </div>
          ))}
          {Object.keys(agentSummary).length === 0 && !isLoading && (
            <div className="col-span-full text-slate-500 text-center py-4">ยังไม่มีข้อมูล</div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock size={20} className="text-indigo-400" />
            ประวัติการใช้เครดิต
          </h2>
          {/* Page filter dropdown */}
          <div className="relative">
            <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} title="กรองตามเพจ"
              className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-sm text-white hover:border-indigo-500/50 transition-all">
              <Globe size={14} className="text-slate-400" />
              <span>{filterPage === 'all' ? 'ทุกเพจ' : (pageNames[filterPage] || filterPage)}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="p-1.5">
                  <button onClick={() => { setFilterPage('all'); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${filterPage === 'all' ? 'bg-indigo-600/20 text-indigo-300' : 'text-white hover:bg-slate-800'}`}>
                    ทุกเพจ
                  </button>
                  {pageList.map(p => (
                    <button key={p.pageId} onClick={() => { setFilterPage(p.pageId); setShowFilterDropdown(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between gap-4 ${filterPage === p.pageId ? 'bg-indigo-600/20 text-indigo-300' : 'text-white hover:bg-slate-800'}`}>
                      <span className="truncate min-w-0 flex-1">{p.pageName}</span>
                      <span className="text-emerald-400 text-xs font-mono whitespace-nowrap flex-shrink-0">{formatThb(p.totalCost)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">กำลังโหลด...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {filterPage === 'all' ? 'ยังไม่มีประวัติ' : `ยังไม่มีรายการสำหรับเพจนี้`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                    <th className="px-4 py-3">เวลา</th>
                    <th className="px-4 py-3">เพจ</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">กิจกรรม</th>
                    <th className="px-4 py-3">โมเดล</th>
                    <th className="px-4 py-3 text-right">Token</th>
                    <th className="px-4 py-3 text-right">ราคา (THB)</th>
                    <th className="px-4 py-3 text-right">ราคา (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((entry, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">{formatTime(entry.timestamp)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded-lg text-slate-300">
                          {pageNames[entry.pageId || ''] || entry.pageId || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">{AGENT_NAMES[entry.agent] || entry.agent}</td>
                      <td className="px-4 py-3 text-slate-200 max-w-[200px] truncate text-xs" title={entry.action}>{entry.action}</td>
                      <td className="px-4 py-3 text-indigo-300 text-xs font-mono">{entry.model}</td>
                      <td className="px-4 py-3 text-right text-slate-400 font-mono text-xs">{(entry.tokens_input + entry.tokens_output).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-300 font-mono text-xs">{formatThb(entry.cost_usd)}</td>
                      <td className="px-4 py-3 text-right text-amber-300/60 font-mono text-xs">{formatCost(entry.cost_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
