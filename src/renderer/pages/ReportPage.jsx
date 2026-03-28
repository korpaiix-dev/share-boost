function ReportPage({ api, showToast, shareProgress, isSharing }) {
  const { useState, useEffect } = React;
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, pending: 0 });
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [history, setHistory] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { loadData(); }, [filterDate, filterStatus]);

  async function loadData() {
    const [todayStats, weekly, hist] = await Promise.all([
      api.getTodayStats(),
      api.getWeeklyStats(),
      api.getShareHistory({ date: filterDate || undefined, status: filterStatus || undefined })
    ]);
    setStats(todayStats);
    setWeeklyStats(weekly);
    setHistory(hist);
  }

  const maxBarValue = Math.max(...weeklyStats.map(d => (d.success || 0) + (d.failed || 0)), 1);

  return (
    <div>
      <h1 className="page-title">📊 รายงาน</h1>

      {/* Today stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#3b82f6' }}>{stats.total}</div>
          <div className="stat-label">ทั้งหมด</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#22c55e' }}>{stats.success}</div>
          <div className="stat-label">สำเร็จ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.failed}</div>
          <div className="stat-label">ล้มเหลว</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#eab308' }}>{stats.pending}</div>
          <div className="stat-label">รอคิว</div>
        </div>
      </div>

      {/* Progress if sharing */}
      {isSharing && shareProgress && (
        <div className="card">
          <div className="card-title">📡 กำลังแชร์</div>
          <ProgressBar
            current={shareProgress.current || 0}
            total={shareProgress.total || 0}
            successCount={shareProgress.successCount}
            failCount={shareProgress.failCount}
            message={shareProgress.message}
          />
        </div>
      )}

      {/* Weekly chart */}
      <div className="card">
        <div className="card-title">📈 สถิติ 7 วัน</div>
        {weeklyStats.length > 0 ? (
          <div>
            <div className="bar-chart">
              {weeklyStats.map((day, i) => {
                const total = (day.success || 0) + (day.failed || 0);
                const successH = total > 0 ? ((day.success || 0) / maxBarValue) * 180 : 2;
                const failH = total > 0 ? ((day.failed || 0) / maxBarValue) * 180 : 0;
                return (
                  <div key={i} className="bar-group">
                    <div className="bar-stack">
                      {failH > 0 && <div className="bar bar-fail" style={{ height: `${failH}px` }}></div>}
                      <div className="bar bar-success" style={{ height: `${successH}px` }}></div>
                    </div>
                    <div className="bar-label">{day.date?.slice(5) || ''}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 justify-center text-xs">
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#22c55e', borderRadius: 2, marginRight: 4 }}></span>สำเร็จ</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 2, marginRight: 4 }}></span>ล้มเหลว</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted" style={{ textAlign: 'center', padding: '40px' }}>ยังไม่มีข้อมูลสถิติ</div>
        )}
      </div>

      {/* History */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="card-title" style={{ marginBottom: 0 }}>📋 ประวัติการแชร์</div>
          <div className="flex gap-2">
            <input type="date" className="form-input" style={{ width: 'auto' }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">ทุกสถานะ</option>
              <option value="success">สำเร็จ</option>
              <option value="failed">ล้มเหลว</option>
              <option value="pending">รอคิว</option>
            </select>
            <button className="btn btn-sm btn-secondary" onClick={loadData}>🔄 รีเฟรช</button>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>เวลา</th>
                <th>บัญชี</th>
                <th>กลุ่ม</th>
                <th>สถานะ</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id}>
                  <td className="text-xs">{item.shared_at || item.created_at}</td>
                  <td className="text-sm">{item.account_name || '-'}</td>
                  <td className="text-sm">{item.group_name || '-'}</td>
                  <td>
                    {item.status === 'success' && <span className="badge badge-success">✅ สำเร็จ</span>}
                    {item.status === 'failed' && <span className="badge badge-danger">❌ ล้มเหลว</span>}
                    {item.status === 'pending' && <span className="badge badge-gray">⏳ รอ</span>}
                    {item.status === 'sharing' && <span className="badge badge-info">🔄 กำลังแชร์</span>}
                  </td>
                  <td className="text-xs text-danger">{item.error_message || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <div className="text-sm text-muted" style={{ textAlign: 'center', padding: '30px' }}>ไม่มีประวัติการแชร์</div>
          )}
        </div>
      </div>
    </div>
  );
}
