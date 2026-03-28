'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, Clock, RefreshCw, Upload, Film, Camera, X, Sparkles, AlertTriangle, ChevronDown, Trash2 } from 'lucide-react';

type MediaFile = { name: string; type: 'photo' | 'video'; path: string; posted: boolean; };
type PageInfo = { id: string; name: string; pageId: string; captionStyle?: string; keywords?: string; };
type Album = { id: string; name: string; files: string[]; createdAt: string; };
type ModalState = { type: 'confirm' | 'result' | 'upload' | 'delete' | 'album' | 'save_album' | null; item?: MediaFile; success?: boolean; caption?: string; postId?: string; error?: string; freedMB?: string; };

export default function MediaPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [posting, setPosting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'pending' | 'posted' | 'albums'>('all');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumNameInput, setAlbumNameInput] = useState('');
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedPage, setSelectedPage] = useState('main');
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [isDraggingPage, setIsDraggingPage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pageDragCounter = useRef(0);
  const modalDragCounter = useRef(0);
  const [postStyle, setPostStyle] = useState('sexy');
  const [postKeywords, setPostKeywords] = useState('');
  const [albumSelected, setAlbumSelected] = useState<Set<string>>(new Set());
  const [albumMode, setAlbumMode] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);

  const CAPTION_STYLES = [
    { id: 'sexy', label: '💋 เซ็กซี่' }, { id: 'cute', label: '🎀 น่ารัก' }, { id: 'funny', label: '😂 ฮา' },
    { id: 'sell', label: '💰 ขายดี' }, { id: 'classy', label: '✨ หรูหรา' },
  ];

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success) {
        const configPages = (data.config.pages || []).map((p: PageInfo & { id?: string }) => ({
          id: p.id || 'main', name: p.name, pageId: p.pageId, captionStyle: p.captionStyle, keywords: p.keywords
        }));
        setPages(configPages);
        if (configPages.length > 0 && selectedPage === 'main' && !configPages.find((p: PageInfo) => p.id === 'main')) {
          setSelectedPage(configPages[0].id);
        }
        // Set initial keywords from page config
        const currentP = configPages.find((p: PageInfo) => p.id === selectedPage);
        if (currentP) {
          setPostKeywords(currentP.keywords || '');
          setPostStyle(currentP.captionStyle || 'sexy');
        }
      }
    } catch {}
  }, [selectedPage]);

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/media?pageId=${selectedPage}`);
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      if (data.success) {
        setMedia(data.media || []);
      }
    } catch (e) { 
      console.error('Fetch media error:', e); 
    } finally {
      setIsLoading(false);
    }
  }, [selectedPage]);

  const fetchAlbums = useCallback(async () => {
    try {
      const res = await fetch(`/api/media/albums?pageId=${selectedPage}`);
      const data = await res.json();
      if (data.success) setAlbums(data.albums || []);
    } catch {}
  }, [selectedPage]);

  useEffect(() => { fetchPages(); }, [fetchPages]);
  useEffect(() => { fetchMedia(); fetchAlbums(); }, [fetchMedia, fetchAlbums]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowPageDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Page-level drag & drop (counter prevents flicker)
  const handlePageDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handlePageDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); pageDragCounter.current++; if (pageDragCounter.current === 1) setIsDraggingPage(true); };
  const handlePageDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); pageDragCounter.current--; if (pageDragCounter.current <= 0) { pageDragCounter.current = 0; setIsDraggingPage(false); } };
  const handlePageDrop = async (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); pageDragCounter.current = 0; setIsDraggingPage(false); await uploadFiles(e.dataTransfer.files); };

  // Modal drag & drop (counter prevents flicker)
  const handleModalDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleModalDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); modalDragCounter.current++; if (modalDragCounter.current === 1) setIsDraggingModal(true); };
  const handleModalDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); modalDragCounter.current--; if (modalDragCounter.current <= 0) { modalDragCounter.current = 0; setIsDraggingModal(false); } };
  const handleModalDrop = async (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); modalDragCounter.current = 0; setIsDraggingModal(false); await uploadFiles(e.dataTransfer.files); };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await uploadFiles(e.target.files);
    e.target.value = '';
  };

  const uploadFiles = async (files: FileList) => {
    setUploadProgress(`กำลังอัปโหลด ${files.length} ไฟล์...`);
    const formData = new FormData();
    formData.append('pageId', selectedPage);
    for (let i = 0; i < files.length; i++) formData.append('files', files[i]);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadProgress(`✅ อัปโหลด ${data.uploaded.length} ไฟล์สำเร็จ!`);
        fetchMedia();
        setTimeout(() => { setUploadProgress(''); setModal({ type: null }); }, 2000);
      } else {
        setUploadProgress(`❌ ${data.error}`);
      }
    } catch { setUploadProgress('❌ เกิดข้อผิดพลาด'); }
  };

  const handleDelete = async (item: MediaFile) => {
    setDeleting(item.name);
    try {
      const res = await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: item.path, pageId: selectedPage })
      });
      const data = await res.json();
      if (data.success) {
        setModal({ type: 'result', success: true, item, caption: data.message, freedMB: data.freedMB });
        fetchMedia();
      } else {
        setModal({ type: 'result', success: false, error: data.error, item });
      }
    } catch { setModal({ type: 'result', success: false, error: 'เชื่อมต่อ Server ไม่ได้' }); }
    setDeleting(null);
  };

  const openConfirm = (item: MediaFile) => {
    const currentP = pages.find(p => p.id === selectedPage);
    setPostKeywords(currentP?.keywords || '');
    setPostStyle(currentP?.captionStyle || 'sexy');
    setModal({ type: 'confirm', item });
  };
  const openDeleteConfirm = (item: MediaFile) => setModal({ type: 'delete', item });

  const toggleAlbumSelect = (name: string) => {
    setAlbumSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const openAlbumConfirm = () => {
    if (albumSelected.size < 2) return;
    const currentP = pages.find(p => p.id === selectedPage);
    setPostKeywords(currentP?.keywords || '');
    setPostStyle(currentP?.captionStyle || 'sexy');
    setModal({ type: 'album' });
  };

  const handlePost = async () => {
    const item = modal.item;
    const isAlbum = modal.type === 'album';
    if (!item && !isAlbum) return;
    setModal({ type: null }); if (item) setPosting(item.name);
    try {
      const body: Record<string, unknown> = {
        pageId: selectedPage,
        captionStyle: postStyle,
        keywords: postKeywords,
      };
      if (isAlbum) {
        const selectedFiles = Array.from(albumSelected);
        body.albumFiles = selectedFiles;
        body.filename = selectedFiles[0];
        body.type = 'photo';
      } else {
        body.filename = item!.name;
        body.type = item!.type;
      }
      const res = await fetch('/api/post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        setModal({ type: 'result', success: true, caption: data.caption, postId: data.postId, item: item || undefined });
        fetchMedia();
        if (isAlbum) { setAlbumSelected(new Set()); setAlbumMode(false); }
      } else { setModal({ type: 'result', success: false, error: data.error, item: item || undefined }); }
    } catch { setModal({ type: 'result', success: false, error: 'เชื่อมต่อ Server ไม่ได้', item: item || undefined }); }
    setPosting(null);
  };

  const openSaveAlbumModal = () => {
    if (albumSelected.size < 2) return;
    setAlbumNameInput('');
    setModal({ type: 'save_album' });
  };

  const handleSaveAlbum = async () => {
    if (albumSelected.size < 2) return;
    const body = {
      action: 'create',
      pageId: selectedPage,
      albumName: albumNameInput.trim(),
      files: Array.from(albumSelected)
    };

    try {
      setPosting('album');
      const res = await fetch('/api/media/albums', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        setModal({ type: 'result', success: true, caption: `✅ บันทึกอัลบั้ม "${data.album.name}" สำเร็จ!\n(AI จะสุ่มหยิบไปโพสต์ตามคิว)` });
        setAlbumSelected(new Set()); setAlbumMode(false);
        fetchAlbums();
      } else {
        setModal({ type: 'result', success: false, error: data.error });
      }
    } catch {
      setModal({ type: 'result', success: false, error: 'เชื่อมต่อ Server ไม่ได้' });
    }
    setPosting(null);
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('ยืนยันลบอัลบั้มนี้ออกจากการจัดกลุ่ม? (ไฟล์ในเครื่องจะไม่ถูกลบ)')) return;
    try {
      const res = await fetch('/api/media/albums', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageId: selectedPage, albumId }) });
      if (res.ok) fetchAlbums();
    } catch {}
  };


  const filtered = media.filter(item => {
    if (filter === 'photo') return item.type === 'photo';
    if (filter === 'video') return item.type === 'video';
    if (filter === 'pending') return !item.posted;
    if (filter === 'posted') return item.posted;
    return true;
  });

  const stats = { total: media.length, photos: media.filter(m => m.type === 'photo').length, videos: media.filter(m => m.type === 'video').length, pending: media.filter(m => !m.posted).length, posted: media.filter(m => m.posted).length };
  const currentPageName = pages.find(p => p.id === selectedPage)?.name || selectedPage;

  return (
    <div ref={dropRef} onDragEnter={handlePageDragIn} onDragLeave={handlePageDragOut} onDragOver={handlePageDrag} onDrop={handlePageDrop}
      className="space-y-6 animate-in fade-in duration-500 pb-10 relative min-h-screen">

      {/* Page-level Drag Overlay */}
      {isDraggingPage && (
        <div className="fixed inset-0 bg-indigo-600/20 backdrop-blur-sm z-40 flex items-center justify-center border-4 border-dashed border-indigo-400 rounded-3xl m-4">
          <div className="text-center">
            <Upload size={64} className="mx-auto mb-4 text-indigo-400 animate-bounce" />
            <p className="text-2xl font-bold text-white">วางไฟล์ที่นี่!</p>
            <p className="text-indigo-300 mt-2">อัปโหลดเข้าคลัง &quot;{currentPageName}&quot;</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="pb-4 border-b border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">📸 คลังสื่อ</h1>
            <p className="text-slate-400">จัดการรูปภาพและวิดีโอของแต่ละเพจ</p>
          </div>
          <div className="flex gap-3">
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowPageDropdown(!showPageDropdown)}
                className="flex items-center gap-2.5 bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-white px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all min-w-[180px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                <span className="truncate">{currentPageName}</span>
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          selectedPage === p.id
                            ? 'bg-indigo-600/20 border border-indigo-500/30'
                            : 'hover:bg-slate-800 border border-transparent'
                        }`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedPage === p.id ? 'bg-indigo-400' : 'bg-slate-600'}`}></span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedPage === p.id ? 'text-indigo-300' : 'text-white'}`}>{p.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">ID: {p.pageId}</p>
                        </div>
                        {selectedPage === p.id && <span className="text-indigo-400 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setModal({ type: 'upload' })}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-lg shadow-indigo-500/20">
              <Upload size={14} /> อัปโหลด
            </button>

            <button onClick={fetchMedia} disabled={isLoading} title="รีเฟรช"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-all">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-3 flex-wrap">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2">
            <Upload size={14} className="text-indigo-400" />
            <span className="text-sm text-slate-300">ทั้งหมด <strong className="text-white">{stats.total}</strong></span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2">
            <Camera size={14} className="text-pink-400" />
            <span className="text-sm text-slate-300">รูป <strong className="text-white">{stats.photos}</strong></span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2">
            <Film size={14} className="text-cyan-400" />
            <span className="text-sm text-slate-300">วิดีโอ <strong className="text-white">{stats.videos}</strong></span>
          </div>
          <div className="bg-slate-900 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-sm text-slate-300">โพสต์แล้ว <strong className="text-emerald-400">{stats.posted}</strong></span>
          </div>
          <div className="bg-slate-900 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <Clock size={14} className="text-amber-400" />
            <span className="text-sm text-slate-300">รอคิว <strong className="text-amber-400">{stats.pending}</strong></span>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {([['all','ทั้งหมด'],['photo','📷 รูปภาพ'],['video','🎬 วิดีโอ'],['pending','⏳ รอคิว'],['posted','✅ โพสต์แล้ว'],['albums','📂 อัลบั้มที่จัดไว้']] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setFilter(key); setDisplayCount(20); if (albumMode) { setAlbumMode(false); setAlbumSelected(new Set()); } }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'}`}>
            {label}
          </button>
        ))}
        <div className="ml-auto flex gap-2 items-center">
          <button onClick={() => { setAlbumMode(!albumMode); if (albumMode) setAlbumSelected(new Set()); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${albumMode ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'}`}>
            🖼️ {albumMode ? 'ยกเลิกจัดกลุ่ม' : 'จัดกลุ่มอัลบั้ม'}
          </button>
          {albumMode && albumSelected.size >= 2 && (
            <div className="flex gap-2">
              <button onClick={openSaveAlbumModal} disabled={posting === 'album'}
                className="bg-pink-600 hover:bg-pink-500 disabled:bg-pink-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-pink-500/30 animate-in fade-in duration-300">
                {posting === 'album' ? '⏳' : `💾 บันทึกเป็นอัลบั้ม (${albumSelected.size} รูป)`}
              </button>
              <button onClick={openAlbumConfirm}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30 animate-in fade-in duration-300">
                🚀 โพสต์ทันที ({albumSelected.size} รูป)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media Grid */}
      {filter === 'albums' ? (
        albums.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-3xl p-16 text-center text-slate-500">
            <span className="text-4xl block mb-4">📂</span>
            <h2 className="text-xl font-medium text-slate-300 mb-2">ยังไม่มีอัลบั้มที่บันทึกไว้ทิ้งไว้</h2>
            <p className="text-sm">กดปุ่มจัดกลุ่มอัลบั้ม เลือกรูป และกดบันทึกเพื่อสร้างอัลบั้มแรก</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {albums.map(album => (
              <div key={album.id} className="bg-slate-900 border border-slate-700 p-5 rounded-2xl relative group hover:border-indigo-500/50 transition-all shadow-lg shadow-black/20">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1 truncate pr-8" title={album.name}>{album.name}</h3>
                    <p className="text-slate-400 text-xs">บันทึกเมื่อ {new Date(album.createdAt).toLocaleDateString('th-TH')}</p>
                  </div>
                  <button onClick={() => handleDeleteAlbum(album.id)} title="ลบการจัดกลุ่มอัลบั้มนี้"
                    className="absolute top-4 right-4 text-slate-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 mt-4">
                  <p className="text-slate-300 text-sm mb-3 font-medium flex items-center gap-2">
                    <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs">{album.files.length} รูป</span>
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {album.files.map((f: string) => (
                      <div key={f} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700 bg-black/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/media/file?path=${encodeURIComponent(`pages/${selectedPage}/photos/${f}`)}`} alt={f} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-[3/4] bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-3xl p-16 text-center text-slate-500">
          <Upload size={48} className="mx-auto mb-4 opacity-30 text-indigo-400" />
          <h2 className="text-xl font-medium text-slate-300 mb-2">
            {media.length === 0 ? `ยังไม่มีไฟล์ใน "${currentPageName}"` : 'ไม่พบสื่อที่ตรงกับตัวกรอง'}
          </h2>
          <p className="mb-4 text-sm">กดปุ่ม &quot;อัปโหลด&quot; หรือลากไฟล์มาวางที่หน้านี้ได้เลย!</p>
          <button onClick={() => setModal({ type: 'upload' })}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all">
            <Upload size={16} /> อัปโหลดไฟล์
          </button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.slice(0, displayCount).map((item, idx) => (
            <div key={idx} onClick={() => { if (albumMode && item.type === 'photo' && !item.posted) toggleAlbumSelect(item.name); }}
              className={`group relative aspect-[3/4] bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 ${albumMode && item.type === 'photo' && !item.posted ? 'cursor-pointer' : ''} ${albumSelected.has(item.name) ? 'border-indigo-500 ring-2 ring-indigo-500/50' : item.posted ? 'border-slate-800/50 opacity-60' : 'border-slate-700 hover:border-indigo-500/50'}`}>
              {item.type === 'photo' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/media/file?path=${encodeURIComponent(item.path)}`} alt={item.name} loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${item.posted ? 'grayscale' : ''}`} />
              ) : (
              <video src={`/api/media/file?path=${encodeURIComponent(item.path)}`}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${item.posted ? 'grayscale' : ''}`}
                  preload="metadata" muted playsInline onLoadedData={e => { e.currentTarget.currentTime = 1; }} />
              )}

              <div className="absolute top-2.5 right-2.5">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md backdrop-blur-md ${item.type === 'video' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'}`}>
                  {item.type === 'video' ? '🎬 VDO' : '📷 IMG'}
                </span>
              </div>

              {/* Album select checkbox (photos only) */}
              {albumMode && item.type === 'photo' && !item.posted && (
                <div className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md border transition-all z-10 ${albumSelected.has(item.name) ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900/70 border-slate-600 text-slate-400'}`}>
                  {albumSelected.has(item.name) ? '✓' : ''}
                </div>
              )}

              {/* Posted badge */}
              {item.posted && (
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                    <CheckCircle size={10} /> โพสต์แล้ว
                  </span>
                </div>
              )}

              {/* Delete button (top-left, shows on hover) */}
              <button onClick={(e) => { e.stopPropagation(); openDeleteConfirm(item); }}
                disabled={deleting === item.name}
                title="ลบไฟล์"
                className={`absolute top-2.5 left-2.5 ${item.posted ? 'top-9' : ''} w-7 h-7 rounded-lg bg-red-600/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md shadow-lg`}>
                <Trash2 size={12} />
              </button>

              {/* Bottom info */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3 pt-10">
                <p className="text-xs text-slate-300 truncate font-medium mb-2.5" title={item.name}>{item.name}</p>
                <div className="flex justify-between items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg backdrop-blur-md border ${item.posted ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/50' : 'text-amber-400 border-amber-500/30 bg-amber-950/50'}`}>
                    {item.posted ? <CheckCircle size={11} /> : <Clock size={11} />}
                    {item.posted ? 'โพสต์แล้ว' : 'รอคิว'}
                  </div>
                  {!item.posted && (
                    <button onClick={() => openConfirm(item)} disabled={posting === item.name}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:animate-pulse text-white text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/25">
                      {posting === item.name ? '⏳' : '🚀 โพสต์'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {filtered.length > displayCount && (
          <div className="flex justify-center mt-6">
            <button onClick={() => setDisplayCount(prev => prev + 20)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-8 py-3 rounded-xl font-medium transition-all border border-slate-700 hover:border-indigo-500/50">
              โหลดเพิ่มเติม ({filtered.length - displayCount} ไฟล์ที่เหลือ)
            </button>
          </div>
        )}
      </>
      )}

      {/* ===== MODALS ===== */}
      {modal.type && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">

            {/* UPLOAD MODAL */}
            {modal.type === 'upload' && (
              <>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center"><Upload size={20} className="text-indigo-400" /></div>
                      <div>
                        <h3 className="text-lg font-bold text-white">อัปโหลดไฟล์</h3>
                        <p className="text-xs text-slate-500">เข้าคลัง &quot;{currentPageName}&quot;</p>
                      </div>
                    </div>
                    <button onClick={() => setModal({ type: null })} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                  </div>

                  {/* Drag zone */}
                  <div
                    onDragEnter={handleModalDragIn} onDragLeave={handleModalDragOut} onDragOver={handleModalDrag} onDrop={handleModalDrop}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${isDraggingModal ? 'border-indigo-400 bg-indigo-600/10' : 'border-slate-700 hover:border-indigo-500/50 bg-slate-800/30'}`}
                    onClick={() => document.getElementById('upload-input')?.click()}
                  >
                    <Upload size={40} className={`mx-auto mb-4 ${isDraggingModal ? 'text-indigo-400 animate-bounce' : 'text-slate-500'}`} />
                    <p className="text-white font-bold text-lg mb-2">
                      {isDraggingModal ? 'ปล่อยเลย!' : 'ลากไฟล์มาวางตรงนี้'}
                    </p>
                    <p className="text-slate-400 text-sm mb-4">หรือกดเพื่อเลือกไฟล์จากเครื่อง</p>
                    <div className="flex gap-2 justify-center text-xs">
                      <span className="bg-pink-500/10 text-pink-300 px-2.5 py-1 rounded-lg border border-pink-500/20">📷 .jpg .png</span>
                      <span className="bg-cyan-500/10 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/20">🎬 .mp4 .mov</span>
                    </div>
                    <input id="upload-input" type="file" multiple accept="image/*,video/*" onChange={handleFileInput} className="hidden" />
                  </div>

                  {/* Upload progress */}
                  {uploadProgress && (
                    <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${uploadProgress.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : uploadProgress.includes('❌') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'}`}>
                      {uploadProgress}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SAVE ALBUM MODAL */}
            {modal.type === 'save_album' && (
              <>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-pink-600/20 flex items-center justify-center"><Sparkles size={20} className="text-pink-400" /></div>
                    <h3 className="text-lg font-bold text-white">ตั้งชื่ออัลบั้ม ({albumSelected.size} รูป)</h3>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto pb-3 mb-4 custom-scrollbar">
                    {Array.from(albumSelected).map(name => (
                      <div key={name} className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-600">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/media/file?path=${encodeURIComponent(`pages/${selectedPage}/photos/${name}`)}`} alt={name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>

                  <div className="mb-2">
                    <label className="text-xs text-slate-400 mb-2 block">📝 ตั้งชื่ออัลบั้ม (ช่วยจำ):</label>
                    <input type="text" value={albumNameInput} onChange={e => setAlbumNameInput(e.target.value)}
                      placeholder={`Album ${new Date().toLocaleDateString('th-TH')}`}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder:text-slate-600" />
                  </div>
                </div>
                <div className="flex gap-3 p-4 pt-0">
                  <button onClick={() => setModal({ type: null })} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors">ยกเลิก</button>
                  <button onClick={handleSaveAlbum} disabled={posting === 'album'} className="flex-1 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2">
                    {posting === 'album' ? '⏳ กำลังบันทึก...' : '💾 บันทึกอัลบั้ม'}
                  </button>
                </div>
              </>
            )}

            {/* POST CONFIRM MODAL */}
            {(modal.type === 'confirm' || modal.type === 'album') && (
              <>
                <div className="p-6">
                  {modal.type === 'confirm' && modal.item && (
                    <div className="w-full h-48 rounded-2xl overflow-hidden mb-5 bg-slate-800">
                      {modal.item.type === 'photo' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/media/file?path=${encodeURIComponent(modal.item.path)}`} alt={modal.item.name} className="w-full h-full object-cover" />
                      ) : (
                        <video src={`/api/media/file?path=${encodeURIComponent(modal.item.path)}`} className="w-full h-full object-cover" preload="metadata" muted playsInline onLoadedData={e => { e.currentTarget.currentTime = 1; }} />
                      )}
                    </div>
                  )}
                  {modal.type === 'album' && (
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                      {Array.from(albumSelected).map(name => (
                        <div key={name} className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border-2 border-indigo-500">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/api/media/file?path=pages/${selectedPage}/photos/${encodeURIComponent(name)}`} alt={name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center"><Sparkles size={20} className="text-indigo-400" /></div>
                    <h3 className="text-lg font-bold text-white">{modal.type === 'album' ? `โพสต์อัลบั้ม (${albumSelected.size} รูป)` : 'ยืนยันสั่งโพสต์'}</h3>
                  </div>

                  {/* Caption Style Selector */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2">🎨 สไตล์แคปชั่น:</p>
                    <div className="flex gap-2 flex-wrap">
                      {CAPTION_STYLES.map(s => (
                        <button key={s.id} onClick={() => setPostStyle(s.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${postStyle === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Keywords Input */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2">🔑 คีย์เวิร์ดในแคปชั่น (แก้ไขเฉพาะโพสต์นี้ได้):</p>
                    <input type="text" value={postKeywords} onChange={e => setPostKeywords(e.target.value)}
                      placeholder="เช่น กดดูโปรไฟล์, ลิงก์ในแชท"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600" />
                  </div>

                  <div className="bg-slate-800/50 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500 truncate">📎 {modal.type === 'album' ? `${albumSelected.size} ไฟล์` : modal.item?.name}</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 pt-0">
                  <button onClick={() => { setModal({ type: null }); if (modal.type === 'album') { setAlbumSelected(new Set()); setAlbumMode(false); } }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors">ยกเลิก</button>
                  <button onClick={handlePost} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"><Sparkles size={16} />สั่งโพสต์เลย!</button>
                </div>
              </>
            )}

            {/* DELETE CONFIRM MODAL */}
            {modal.type === 'delete' && modal.item && (
              <>
                <div className="p-6">
                  <div className="w-full h-48 rounded-2xl overflow-hidden mb-5 bg-slate-800">
                    {modal.item.type === 'photo' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/media/file?path=${encodeURIComponent(modal.item.path)}`} alt={modal.item.name} className="w-full h-full object-cover" />
                    ) : (
                      <video src={`/api/media/file?path=${encodeURIComponent(modal.item.path)}`} className="w-full h-full object-cover" preload="metadata" muted playsInline onLoadedData={e => { e.currentTarget.currentTime = 1; }} />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center"><Trash2 size={20} className="text-red-400" /></div>
                    <h3 className="text-lg font-bold text-white">ยืนยันลบไฟล์</h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">ไฟล์จะถูก<strong className="text-red-400">ลบออกจากเครื่องถาวร</strong>และคืนพื้นที่ให้</p>
                  <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-3 py-2"><p className="text-xs text-red-300 truncate">🗑️ {modal.item.name}</p></div>
                </div>
                <div className="flex gap-3 p-4 pt-0">
                  <button onClick={() => setModal({ type: null })} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors">ยกเลิก</button>
                  <button onClick={() => { if (modal.item) handleDelete(modal.item); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"><Trash2 size={16} />ลบเลย!</button>
                </div>
              </>
            )}

            {/* RESULT MODAL */}
            {modal.type === 'result' && (
              <>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modal.success ? 'bg-emerald-600/20' : 'bg-red-600/20'}`}>
                        {modal.success ? <CheckCircle size={20} className="text-emerald-400" /> : <AlertTriangle size={20} className="text-red-400" />}
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {modal.success
                          ? (modal.freedMB ? '🗑️ ลบสำเร็จ!' : '🎉 โพสต์สำเร็จ!')
                          : '❌ เกิดข้อผิดพลาด'}
                      </h3>
                    </div>
                    <button onClick={() => setModal({ type: null })} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                  </div>
                  {modal.success ? (
                    <div className="space-y-3">
                      <div className="bg-slate-800/50 rounded-xl p-4 overflow-hidden">
                        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed break-all">{modal.caption}</p>
                      </div>
                      {modal.postId && (
                        <div className="bg-slate-800/50 rounded-xl px-4 py-2.5 flex justify-between items-center">
                          <span className="text-xs text-slate-500">Post ID</span>
                          <span className="text-xs text-indigo-300 font-mono">{modal.postId}</span>
                        </div>
                      )}
                      {modal.freedMB && (
                        <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex justify-between items-center">
                          <span className="text-xs text-slate-400">คืนพื้นที่</span>
                          <span className="text-sm text-emerald-300 font-bold">{modal.freedMB} MB</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4"><p className="text-sm text-red-300">{modal.error}</p></div>
                  )}
                </div>
                <div className="p-4 pt-0">
                  <button onClick={() => setModal({ type: null })} className={`w-full py-3 rounded-xl font-bold transition-all ${modal.success ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
                    {modal.success ? (modal.freedMB ? 'เรียบร้อย!' : 'เยี่ยมไปเลย! 🎊') : 'ปิด'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
