function SharePage({ api, showToast, shareProgress, isSharing, setIsSharing, setShareProgress }) {
  const { useState, useEffect } = React;
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [postTab, setPostTab] = useState('url');
  const [postUrl, setPostUrl] = useState('');
  const [postText, setPostText] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [captionData, setCaptionData] = useState({ caption: '', useAi: false });
  const [scheduleType, setScheduleType] = useState('now');
  const [scheduleTime, setScheduleTime] = useState('');
  const [speed, setSpeed] = useState('normal');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (shareProgress) {
      setLogs(prev => {
        const newLog = {
          time: new Date().toLocaleTimeString('th-TH'),
          group: shareProgress.groupName,
          message: shareProgress.message || shareProgress.status,
          status: shareProgress.status
        };
        return [newLog, ...prev].slice(0, 100);
      });
    }
  }, [shareProgress]);

  async function loadAccounts() {
    const accs = await api.getAccounts();
    setAccounts(accs);
    if (accs.length > 0 && !selectedAccount) setSelectedAccount(accs[0].id);
  }

  const speedMap = { fast: { min: 30, max: 120 }, normal: { min: 120, max: 300 }, slow: { min: 300, max: 600 } };

  async function handleStartShare() {
    if (!selectedAccount) { showToast('กรุณาเลือกบัญชี', 'error'); return; }
    if (selectedGroups.length === 0) { showToast('กรุณาเลือกกลุ่มอย่างน้อย 1 กลุ่ม', 'error'); return; }
    if (postTab === 'url' && !postUrl.trim()) { showToast('กรุณาใส่ URL โพสต์', 'error'); return; }
    if (postTab === 'text' && !postText.trim() && !captionData.caption) { showToast('กรุณาใส่เนื้อหาโพสต์', 'error'); return; }

    const sp = speedMap[speed];
    setIsSharing(true);
    setLogs([]);

    try {
      await api.startSharing({
        accountId: selectedAccount,
        groupIds: selectedGroups,
        postUrl: postTab === 'url' ? postUrl : null,
        postText: postTab === 'text' ? postText : null,
        caption: captionData.caption,
        captionStyle: captionData.style || '',
        useAiCaption: captionData.useAi,
        delayMin: sp.min,
        delayMax: sp.max,
        scheduleType,
        scheduledAt: scheduleType === 'custom' ? scheduleTime : null
      });
      showToast('เริ่มแชร์แล้ว!', 'success');
    } catch (err) {
      showToast(`เกิดข้อผิดพลาด: ${err.message || err}`, 'error');
      setIsSharing(false);
    }
  }

  async function handleStop() {
    await api.stopSharing();
    setIsSharing(false);
    showToast('หยุดแชร์แล้ว', 'success');
  }

  return (
    <div>
      <h1 className="page-title">🚀 แชร์โพสต์</h1>

      {/* Account selector */}
      <div className="card">
        <div className="flex items-center gap-3">
          <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>บัญชี Facebook</label>
          <select
            className="form-select flex-1"
            value={selectedAccount || ''}
            onChange={e => setSelectedAccount(Number(e.target.value))}
          >
            <option value="">-- เลือกบัญชี --</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} {acc.status === 'active' ? '🟢' : '🔴'}
              </option>
            ))}
          </select>
          {accounts.length === 0 && (
            <span className="text-xs text-warning">ยังไม่มีบัญชี — ไปที่ตั้งค่าเพื่อเพิ่ม</span>
          )}
        </div>
      </div>

      {/* Post content */}
      <div className="card">
        <div className="card-title">📝 เนื้อหาโพสต์</div>
        <div className="tabs">
          <div className={`tab ${postTab === 'url' ? 'active' : ''}`} onClick={() => setPostTab('url')}>วาง URL</div>
          <div className={`tab ${postTab === 'text' ? 'active' : ''}`} onClick={() => setPostTab('text')}>พิมพ์เอง</div>
        </div>
        {postTab === 'url' ? (
          <input
            type="text"
            className="form-input"
            placeholder="วาง URL โพสต์ Facebook ที่ต้องการแชร์..."
            value={postUrl}
            onChange={e => setPostUrl(e.target.value)}
          />
        ) : (
          <textarea
            className="form-textarea"
            rows="4"
            placeholder="พิมพ์เนื้อหาโพสต์..."
            value={postText}
            onChange={e => setPostText(e.target.value)}
          />
        )}
      </div>

      {/* AI Caption */}
      <CaptionAI api={api} onCaptionSelect={setCaptionData} showToast={showToast} />

      {/* Group selector */}
      <div className="card">
        <div className="card-title">👥 เลือกกลุ่ม</div>
        <GroupSelector
          api={api}
          accountId={selectedAccount}
          selectedGroups={selectedGroups}
          onSelectionChange={setSelectedGroups}
        />
      </div>

      {/* Schedule & Speed */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">⏰ ตั้งเวลา</div>
          <div className="level-group">
            {[
              { id: 'now', label: 'แชร์ทันที' },
              { id: 'spread', label: 'กระจายตลอดวัน' },
              { id: 'custom', label: 'ตั้งเวลาเอง' }
            ].map(s => (
              <div key={s.id} className={`level-btn ${scheduleType === s.id ? 'selected' : ''}`} onClick={() => setScheduleType(s.id)}>
                {s.label}
              </div>
            ))}
          </div>
          {scheduleType === 'custom' && (
            <input
              type="datetime-local"
              className="form-input mt-2"
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
            />
          )}
        </div>
        <div className="card">
          <div className="card-title">⚡ ความเร็ว</div>
          <div className="speed-group">
            {[
              { id: 'fast', label: 'เร็ว', desc: '30s-2m' },
              { id: 'normal', label: 'ปกติ', desc: '2-5m' },
              { id: 'slow', label: 'ช้า', desc: '5-10m' }
            ].map(s => (
              <div key={s.id} className={`speed-btn ${speed === s.id ? 'selected' : ''}`} onClick={() => setSpeed(s.id)}>
                <div>{s.label}</div>
                <div className="text-xs text-muted">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start/Stop button */}
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        {!isSharing ? (
          <button className="btn btn-success btn-lg" onClick={handleStartShare}>
            🚀 เริ่มแชร์ ({selectedGroups.length} กลุ่ม)
          </button>
        ) : (
          <button className="btn btn-danger btn-lg" onClick={handleStop}>
            ⏹️ หยุดแชร์
          </button>
        )}
      </div>

      {/* Progress */}
      {isSharing && shareProgress && (
        <div className="card">
          <div className="card-title">📡 สถานะ</div>
          <ProgressBar
            current={shareProgress.current || 0}
            total={shareProgress.total || 0}
            successCount={shareProgress.successCount}
            failCount={shareProgress.failCount}
            message={shareProgress.message}
          />
        </div>
      )}

      {/* Log */}
      {logs.length > 0 && (
        <div className="card">
          <div className="card-title">📋 Log</div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {logs.map((log, i) => (
              <div key={i} className="log-entry">
                <span className="log-time">{log.time}</span>
                <span className="log-message">{log.group && `[${log.group}] `}{log.message}</span>
                <span>
                  {log.status === 'done' && <span className="badge badge-success">สำเร็จ</span>}
                  {log.status === 'failed' && <span className="badge badge-danger">ล้มเหลว</span>}
                  {log.status === 'sharing' && <span className="badge badge-info">กำลังแชร์</span>}
                  {log.status === 'waiting' && <span className="badge badge-gray">รอ</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
