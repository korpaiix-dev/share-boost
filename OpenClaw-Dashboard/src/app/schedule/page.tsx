'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, FileText, Plus, Trash2, Clock, ChevronDown, Globe, RefreshCw, Save } from 'lucide-react';

interface PageConfig {
  id: string;
  name: string;
  pageId: string;
  schedule?: string[];
}

interface NextPost {
  filename: string;
  caption: string;
  type: string;
  url: string;
}

export default function SchedulePage() {
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [nextPost, setNextPost] = useState<NextPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTime, setNewTime] = useState('12:00');
  const [saving, setSaving] = useState(false);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [editCaption, setEditCaption] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  const [refreshingCaption, setRefreshingCaption] = useState(false);
  const [cancelingQueue, setCancelingQueue] = useState(false);
  const [randomizing, setRandomizing] = useState(false);
  const [showCancelQueueModal, setShowCancelQueueModal] = useState(false);
  const [captionStatus, setCaptionStatus] = useState('');

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowPageDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/config?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        const configPages = data.config.pages || [];
        setPages(configPages);
        // Auto-select first page
        if (configPages.length > 0 && !selectedPage) {
          setSelectedPage(configPages[0].id);
        }
      }
    } catch (e) { console.error(e); }
  }, [selectedPage]);

  const fetchSchedule = useCallback(async () => {
    if (!selectedPage) return;
    try {
      const res = await fetch(`/api/schedule?pageId=${selectedPage}&t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setNextPost(data.nextPost);
        if (data.nextPost?.caption) setEditCaption(data.nextPost.caption);
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, [selectedPage]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);
  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const currentPage = pages.find(p => p.id === selectedPage);
  const currentSchedule = currentPage?.schedule || [];

  const addTime = async () => {
    if (!selectedPage || !newTime) return;
    setSaving(true);
    try {
      const schedule = [...currentSchedule, newTime].sort();
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePageSchedule', pageId: selectedPage, schedule })
      });
      const data = await res.json();
      if (data.success) {
        setPages(data.config.pages || []);
        setShowAddModal(false);
        setNewTime('12:00');
      }
    } catch { }
    setSaving(false);
  };

  const removeTime = async (time: string) => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      const schedule = currentSchedule.filter(t => t !== time);
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePageSchedule', pageId: selectedPage, schedule })
      });
      const data = await res.json();
      if (data.success) {
        setPages(data.config.pages || []);
      }
    } catch { }
    setSaving(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="pb-4 border-b border-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">📅 ตารางโพสต์</h1>
            <p className="text-slate-400">จัดการเวลาโพสต์อัตโนมัติแต่ละเพจ</p>
          </div>
          {/* Page Selector */}
          {pages.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowPageDropdown(!showPageDropdown)}
                className="flex items-center gap-2.5 bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-white px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all min-w-[180px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                <span className="truncate">{currentPage?.name || 'เลือกเพจ'}</span>
                <ChevronDown size={14} className={`text-slate-400 ml-auto transition-transform ${showPageDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showPageDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 border-b border-slate-800">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-1.5">เลือกเพจ</p>
                  </div>
                  <div className="p-1.5 max-h-64 overflow-y-auto">
                    {pages.map(p => (
                      <button key={p.id}
                        onClick={() => { setSelectedPage(p.id); setShowPageDropdown(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${selectedPage === p.id
                            ? 'bg-indigo-600/20 border border-indigo-500/30'
                            : 'hover:bg-slate-800 border border-transparent'
                          }`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedPage === p.id ? 'bg-indigo-400' : 'bg-slate-600'}`}></span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedPage === p.id ? 'text-indigo-300' : 'text-white'}`}>{p.name}</p>
                          <p className="text-[10px] text-slate-500">{(p.schedule || []).length} เวลา</p>
                        </div>
                        {selectedPage === p.id && <span className="text-indigo-400 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Upcoming Post Preview */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-pink-400" />
          พรีวิวโพสต์คิวถัดไป
        </h2>
        {isLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl h-32 animate-pulse"></div>
        ) : nextPost ? (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-indigo-500/30 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start shadow-lg shadow-indigo-900/10">
            <div className="w-full md:w-64 aspect-video bg-black/50 rounded-xl overflow-hidden shadow-inner flex-shrink-0 relative group">
              {nextPost.type === 'video' ? (
                <video src={nextPost.url} className="w-full h-full object-cover opacity-80" controls preload="metadata" onLoadedData={(e) => { e.currentTarget.currentTime = 1; }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nextPost.url} alt="Queue preview" className="w-full h-full object-cover opacity-90" />
              )}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] uppercase font-bold">
                {nextPost.type === 'video' ? '🎬 VIDEO' : '📷 PHOTO'}
              </div>
            </div>
            <div className="flex-1 space-y-3 w-full">
              <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md text-xs font-bold uppercase">Queue #1</span>

              {/* Editable Caption */}
              <textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={5}
                placeholder="แคปชั่น..."
                className="w-full bg-slate-800/60 border border-slate-700 text-slate-200 text-sm leading-relaxed rounded-xl p-3 mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder:text-slate-600"
              />

              {/* Caption action buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    setSavingCaption(true); setCaptionStatus('');
                    try {
                      const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateCaption', pageId: selectedPage, caption: editCaption }) });
                      const data = await res.json();
                      if (data.success) { setCaptionStatus('✅ บันทึกแล้ว'); setTimeout(() => setCaptionStatus(''), 2000); }
                      else setCaptionStatus('❌ ' + data.error);
                    } catch { setCaptionStatus('❌ เชื่อมต่อไม่ได้'); }
                    setSavingCaption(false);
                  }}
                  disabled={savingCaption}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-medium transition-all">
                  <Save size={14} />
                  {savingCaption ? 'กำลังบันทึก...' : '💾 บันทึกแคปชั่น'}
                </button>
                <button
                  onClick={async () => {
                    setRefreshingCaption(true); setCaptionStatus('');
                    try {
                      const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refreshCaption', pageId: selectedPage }) });
                      const data = await res.json();
                      if (data.success && data.caption) { setEditCaption(data.caption); setCaptionStatus('✅ สร้างแคปชั่นใหม่แล้ว'); setTimeout(() => setCaptionStatus(''), 3000); }
                      else setCaptionStatus('❌ ' + (data.error || 'Error'));
                    } catch { setCaptionStatus('❌ เชื่อมต่อไม่ได้'); }
                    setRefreshingCaption(false);
                  }}
                  disabled={refreshingCaption}
                  className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-medium transition-all">
                  <RefreshCw size={14} className={refreshingCaption ? 'animate-spin' : ''} />
                  {refreshingCaption ? 'AI กำลังคิด...' : '🔄 สร้างแคปชั่นใหม่'}
                </button>
                <button
                  onClick={async () => {
                    setRandomizing(true); setCaptionStatus('');
                    try {
                      const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'randomizeQueue', pageId: selectedPage }) });
                      const data = await res.json();
                      if (data.success) { setCaptionStatus('✅ ' + data.message); fetchSchedule(); }
                      else setCaptionStatus('❌ ' + (data.error || 'Error'));
                    } catch { setCaptionStatus('❌ เชื่อมต่อไม่ได้'); }
                    setRandomizing(false);
                  }}
                  disabled={randomizing}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-medium transition-all">
                  <RefreshCw size={14} className={randomizing ? 'animate-spin' : ''} />
                  {randomizing ? 'กำลังสุ่ม...' : '🎲 สุ่มวิดีโอ/รูปใหม่'}
                </button>
                <button
                  onClick={() => setShowCancelQueueModal(true)}
                  disabled={cancelingQueue}
                  className="flex items-center gap-1.5 bg-red-900/50 hover:bg-red-800/80 text-red-300 border border-red-800/50 disabled:opacity-50 px-3 py-2 rounded-xl text-xs font-medium transition-all ml-auto">
                  <Trash2 size={14} />
                  {cancelingQueue ? 'กำลังยกเลิก...' : '❌ ยกเลิกคิวนี้'}
                </button>
              </div>
              {captionStatus && <p className="text-xs font-medium text-slate-300 mt-3 border-t border-slate-700 pt-3">{captionStatus}</p>}

              <div className="pt-3 border-t border-slate-700/50 mt-4">
                <p className="text-slate-500 text-xs font-mono truncate" title={nextPost.filename}>📄 {nextPost.filename}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500 font-medium">
            ⏳ ยังไม่มีคิวโพสต์ถัดไป
          </div>
        )}
      </div>

      {/* Per-page Schedule */}
      <div className="max-w-3xl">
        {/* Time Slots */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-indigo-400" />
              เวลาโพสต์ {currentPage ? `(${currentPage.name})` : ''}
            </h2>
            {selectedPage && (
              <button
                onClick={() => { setShowAddModal(true); setNewTime('12:00'); }}
                disabled={!selectedPage}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
              >
                <Plus size={16} /> เพิ่มเวลา
              </button>
            )}
          </div>

          {pages.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500">
              <Globe size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">ยังไม่มีเพจ</p>
              <p className="text-xs">ไปที่หน้า &quot;ตั้งค่า&quot; เพื่อเพิ่มเพจก่อน แล้วกลับมาตั้งเวลาที่นี่</p>
            </div>
          ) : !selectedPage ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500">
              เลือกเพจด้านบนเพื่อจัดการเวลาโพสต์
            </div>
          ) : currentSchedule.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500">
              <Clock size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">ยังไม่ได้ตั้งเวลาสำหรับเพจนี้</p>
              <p className="text-xs">กดปุ่ม &quot;เพิ่มเวลา&quot; เพื่อตั้งเวลาโพสต์อัตโนมัติ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentSchedule.sort().map(time => (
                <div key={`${selectedPage}-${time}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/20">
                      {time}
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">โพสต์ Facebook อัตโนมัติ</p>
                      <p className="text-slate-500 text-xs">ทำงานทุกวัน เวลา {time} น. — {currentPage?.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeTime(time)}
                    disabled={saving}
                    className="bg-slate-800 text-slate-400 w-10 h-10 rounded-lg flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="ลบเวลานี้"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick summary of all pages */}
          {pages.length > 1 && (
            <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">📊 ภาพรวมทุกเพจ</h3>
              <div className="space-y-2">
                {pages.map(page => (
                  <div key={`summary-${page.id}`} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 font-medium">{page.name}</span>
                    <div className="flex gap-1.5">
                      {(page.schedule || []).length === 0 ? (
                        <span className="text-slate-600 text-xs">ไม่ได้ตั้งเวลา</span>
                      ) : (
                        (page.schedule || []).sort().map(t => (
                          <span key={`${page.id}-sum-${t}`} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-medium">
                            {t}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


      </div>

      {/* Add Time Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                  <Plus size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">เพิ่มเวลาโพสต์</h3>
                  <p className="text-xs text-slate-500">{currentPage?.name}</p>
                </div>
              </div>

              <p className="text-slate-400 text-sm mb-4">เลือกเวลาที่ต้องการให้โพสต์อัตโนมัติทุกวัน</p>

              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                title="เลือกเวลาโพสต์"
                className="w-full bg-slate-800 border border-slate-700 text-white text-2xl font-bold text-center rounded-xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3 p-4 pt-0">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors">ยกเลิก</button>
              <button onClick={addTime} disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                <Plus size={16} /> เพิ่มเวลา
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Queue Modal */}
      {showCancelQueueModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-900/30 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ยกเลิกคิวนี้ ?</h3>
              <p className="text-sm text-slate-400 mb-6">หากยกเลิกคิวนี้ คิวจะว่างลงชั่วคราวจนกว่าคุณจะกดให้ AI สุ่มคิวให้ใหม่ หรือจนกว่าจะถึงรอบเวลาโพสต์อัตโนมัติรอบถัดไป</p>

              <div className="flex gap-3">
                <button onClick={() => setShowCancelQueueModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors">ย้อนกลับ</button>
                <button
                  onClick={async () => {
                    setCancelingQueue(true); setCaptionStatus('');
                    try {
                      const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteQueue', pageId: selectedPage }) });
                      const data = await res.json();
                      if (data.success) { setCaptionStatus('✅ ' + data.message); setShowCancelQueueModal(false); fetchSchedule(); }
                      else setCaptionStatus('❌ ' + (data.error || 'Error'));
                    } catch { setCaptionStatus('❌ เชื่อมต่อไม่ได้'); }
                    setCancelingQueue(false);
                  }}
                  disabled={cancelingQueue}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                >
                  {cancelingQueue ? '⏳ กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
