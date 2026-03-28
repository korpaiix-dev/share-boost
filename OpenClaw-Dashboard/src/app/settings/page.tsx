'use client';
import { useState, useEffect, useCallback } from 'react';
import { CreditCard, ExternalLink, ShieldCheck, Database, Key, AlertTriangle, Globe, Power, Plus, Trash2, Shield, Clock, Settings } from 'lucide-react';

const CAPTION_STYLES = [
  { id: 'sexy', label: '💋 เซ็กซี่', desc: 'น่าดึงดูด ขี้เล่น' },
  { id: 'cute', label: '🎀 น่ารัก', desc: 'สดใส อ่อนหวาน' },
  { id: 'funny', label: '😂 ฮา', desc: 'ขำขัน มุกตลก' },
  { id: 'sell', label: '💰 ขายดี', desc: 'CTA แรง โน้มน้าว' },
  { id: 'classy', label: '✨ หรูหรา', desc: 'ดูแพง พรีเมียม' },
];

interface PageConfig {
  id: string;
  name: string;
  pageId: string;
  accessToken: string;
  captionStyle?: string;
  keywords?: string;
  schedule?: string[];
  autoTrending?: boolean;
}

export default function SettingsPage() {
  const [apiData, setApiData] = useState<Record<string, Record<string, unknown>> | null>(null);
  const [config, setConfig] = useState({ captionStyle: 'sexy', emergencyStop: false, pages: [] as PageConfig[] });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPage, setNewPage] = useState({ name: '', pageId: '', accessToken: '', schedule: ['09:00', '19:30'] as string[] });
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('12:00');

  const fetchAll = useCallback(async () => {
    try {
      const [settingsRes, configRes] = await Promise.all([fetch('/api/settings'), fetch('/api/config')]);
      const settingsJson = await settingsRes.json();
      const configJson = await configRes.json();
      if (settingsJson.success) setApiData(settingsJson);
      if (configJson.success) setConfig(configJson.config);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateConfig = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) setConfig(data.config);
    } catch {}
    setSaving(false);
  };

  const addPage = () => {
    if (!newPage.name || !newPage.pageId || !newPage.accessToken) return;
    updateConfig({ action: 'addPage', page: newPage });
    setNewPage({ name: '', pageId: '', accessToken: '', schedule: ['09:00', '19:30'] });
    setShowAddPage(false);
  };

  const removePage = (pageId: string) => {
    if (!confirm(`ลบเพจ "${config.pages.find(p => p.id === pageId)?.name}" ?`)) return;
    updateConfig({ action: 'removePage', pageId });
  };

  const addTimeToPage = (pageId: string) => {
    const page = config.pages.find(p => p.id === pageId);
    if (!page) return;
    const schedule = [...(page.schedule || []), newTime].sort();
    updateConfig({ action: 'updatePageSchedule', pageId, schedule });
  };

  const removeTimeFromPage = (pageId: string, time: string) => {
    const page = config.pages.find(p => p.id === pageId);
    if (!page) return;
    const schedule = (page.schedule || []).filter(t => t !== time);
    updateConfig({ action: 'updatePageSchedule', pageId, schedule });
  };

  const addNewPageTime = () => {
    setNewPage({ ...newPage, schedule: [...newPage.schedule, '12:00'].sort() });
  };

  const removeNewPageTime = (idx: number) => {
    setNewPage({ ...newPage, schedule: newPage.schedule.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">⚙️ การตั้งค่า</h1>
        <p className="text-slate-400">จัดการ API, สไตล์แคปชั่น, เวลาโพสต์แต่ละเพจ</p>
      </header>

      {/* 🚨 EMERGENCY STOP */}
      <div className={`border rounded-2xl p-6 transition-all ${config.emergencyStop ? 'bg-red-950/40 border-red-500/50 shadow-lg shadow-red-500/10' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.emergencyStop ? 'bg-red-600/30' : 'bg-emerald-600/20'}`}>
              {config.emergencyStop ? <AlertTriangle size={28} className="text-red-400" /> : <Shield size={28} className="text-emerald-400" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Power size={20} /> Emergency Stop</h2>
              <p className="text-slate-400 text-sm">{config.emergencyStop ? '🔴 Agent ทั้งหมดถูกหยุด!' : '🟢 ระบบทำงานปกติ'}</p>
            </div>
          </div>
          <button onClick={() => updateConfig({ emergencyStop: !config.emergencyStop })} disabled={saving}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${config.emergencyStop ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
            {saving ? '...' : config.emergencyStop ? '✅ เปิดระบบ' : '🛑 หยุดทันที!'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl h-64 animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* OpenRouter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><CreditCard size={20} /></div>
              <h2 className="text-xl font-bold text-white">OpenRouter AI</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-slate-400">สถานะ API</span>
                <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20"><ShieldCheck size={14} /> ปกติ</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-slate-400">ยอดใช้งาน</span>
                <span className="text-slate-300 font-medium">${(apiData?.openRouter?.usage as number)?.toFixed(2) || '0.00'}</span>
              </div>
              <a href="https://openrouter.ai/credits" target="_blank" rel="noreferrer noopener" className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors">
                <ExternalLink size={16} /> เติมเงิน / ตรวจสอบ
              </a>
            </div>
          </div>

          {/* Facebook */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center"><Database size={20} /></div>
              <h2 className="text-xl font-bold text-white">Facebook Graph API</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <span className="text-slate-400">Page ID (หลัก)</span>
                <span className="text-slate-300 font-mono text-sm">{apiData?.facebook?.pageId as string}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Access Token</span>
                {apiData?.facebook?.tokenSet ? (
                  <span className="text-emerald-400 text-sm font-medium flex items-center gap-1.5"><Key size={14} /> ตั้งค่าแล้ว</span>
                ) : (
                  <span className="text-rose-400 text-sm">ไม่ได้ตั้งค่า</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 🌐 Multi-Page with Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Globe size={20} className="text-cyan-400" /> เพจทั้งหมด</h2>
          <button onClick={() => setShowAddPage(true)} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
            <Plus size={16} /> เพิ่มเพจ
          </button>
        </div>

        {config.pages.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500">
            <Globe size={32} className="mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีเพจ — เพจหลักใช้ค่าจาก .env</p>
            <p className="text-xs mt-1">กดปุ่ม &quot;เพิ่มเพจ&quot; เพื่อเริ่มจัดการแต่ละเพจ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {config.pages.map(page => (
              <div key={page.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{page.name}</h3>
                    <p className="text-slate-500 text-xs font-mono">ID: {page.pageId} | Slug: {page.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingPage(editingPage === page.id ? null : page.id)}
                      className="text-slate-400 hover:text-cyan-400 transition-colors p-1" title="จัดการ">
                      <Settings size={16} />
                    </button>
                    <button onClick={() => removePage(page.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1" title="ลบเพจ">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Schedule display */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <Clock size={14} className="text-amber-400 mt-0.5" />
                  {(page.schedule || []).map(time => (
                    <span key={time} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                      {time}
                      {editingPage === page.id && (
                        <button onClick={() => removeTimeFromPage(page.id, time)} className="text-amber-500 hover:text-red-400 ml-1">✕</button>
                      )}
                    </span>
                  ))}
                  {(page.schedule || []).length === 0 && <span className="text-slate-500 text-xs">ยังไม่ได้ตั้งเวลา</span>}
                </div>

                {/* Expanded edit panel */}
                {editingPage === page.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex gap-2">
                      <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      <button onClick={() => addTimeToPage(page.id)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
                        + เพิ่มเวลา
                      </button>
                    </div>

                    {/* Per-page caption style */}
                    <div>
                      <p className="text-xs text-slate-400 mb-2">สไตล์แคปชั่นเฉพาะเพจนี้:</p>
                      <div className="flex gap-2 flex-wrap">
                        {CAPTION_STYLES.map(style => (
                          <button key={style.id} onClick={() => updateConfig({ action: 'updatePageStyle', pageId: page.id, captionStyle: style.id })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${(page.captionStyle || 'sexy') === style.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Per-page keywords */}
                    <div>
                      <p className="text-xs text-slate-400 mb-2">🔑 คีย์เวิร์ดประจำเพจ (จะอยู่ในแคปชั่นทุกโพสต์):</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={page.keywords || ''}
                          placeholder="เช่น กดดูโปรไฟล์, ลิงก์ในแชท, กดติดตาม"
                          onBlur={(e) => updateConfig({ action: 'updatePageKeywords', pageId: page.id, keywords: e.target.value })}
                          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-600"
                        />
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1">ตั้งครั้งเดียว ใช้ได้ทุกโพสต์ เปลี่ยนทีหลังได้</p>
                    </div>

                    {/* Auto Trending */}
                    <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                      <div>
                        <p className="text-sm font-medium text-white flex items-center gap-2"><span className="text-amber-400">🔥</span> ดึงแฮชแท็กกระแสฮิตอัตโนมัติ</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">ให้ AI เสริมแฮชแท็กดังของวันนี้ลงในแคปชั่น</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={page.autoTrending ?? true} 
                          onChange={(e) => updateConfig({ action: 'updatePageAutoTrending', pageId: page.id, autoTrending: e.target.checked })} />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="bg-slate-950 border border-amber-500/20 rounded-2xl p-6">
        <h3 className="text-amber-400 font-bold mb-2">คำเตือนระบบ Automation</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          ตั้งค่า Mac ไม่ให้หลับ: <b>System Settings &gt; Displays &gt; Advanced...</b> เปิด <code>Prevent automatic sleeping</code>
        </p>
      </div>

      {/* Add Page Modal */}
      {showAddPage && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center"><Globe size={20} className="text-cyan-400" /></div>
                <h3 className="text-lg font-bold text-white">เพิ่มเพจใหม่</h3>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">ชื่อเพจ</label>
                <input value={newPage.name} onChange={e => setNewPage({...newPage, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="เช่น แจกกลุ่ม Telegram" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Facebook Page ID</label>
                <input value={newPage.pageId} onChange={e => setNewPage({...newPage, pageId: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="123456789" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Access Token</label>
                <input value={newPage.accessToken} onChange={e => setNewPage({...newPage, accessToken: e.target.value})} type="password"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="EAAxxxxx..." />
              </div>

              {/* Schedule Times */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">เวลาโพสต์</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newPage.schedule.map((time, idx) => (
                    <span key={idx} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                      <input type="time" value={time} onChange={e => {
                        const s = [...newPage.schedule]; s[idx] = e.target.value; setNewPage({...newPage, schedule: s.sort()});
                      }} className="bg-transparent border-none outline-none text-amber-300 w-20" />
                      <button onClick={() => removeNewPageTime(idx)} className="text-amber-500 hover:text-red-400">✕</button>
                    </span>
                  ))}
                  <button onClick={addNewPageTime} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-all">+ เพิ่ม</button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 pt-0">
              <button onClick={() => setShowAddPage(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors">ยกเลิก</button>
              <button onClick={addPage} disabled={!newPage.name || !newPage.pageId || !newPage.accessToken}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all">เพิ่มเพจ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
