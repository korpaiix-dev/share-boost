function SettingsPage({ api, showToast }) {
  const { useState, useEffect } = React;
  const [settings, setSettings] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [newAccountName, setNewAccountName] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [loginLoading, setLoginLoading] = useState(null);
  const [testingAi, setTestingAi] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [s, a] = await Promise.all([api.getSettings(), api.getAccounts()]);
    setSettings(s);
    setAccounts(a);
  }

  async function handleSettingChange(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
    await api.setSetting(key, value);
  }

  async function handleAddAccount() {
    if (!newAccountName.trim()) { showToast('กรุณาใส่ชื่อบัญชี', 'error'); return; }
    await api.addAccount(newAccountName);
    setNewAccountName('');
    setShowAddAccount(false);
    showToast('เพิ่มบัญชีสำเร็จ', 'success');
    loadData();
  }

  async function handleDeleteAccount(id) {
    await api.deleteAccount(id);
    showToast('ลบบัญชีสำเร็จ', 'success');
    loadData();
  }

  async function handleLogin(id) {
    setLoginLoading(id);
    try {
      const result = await api.loginAccount(id);
      if (result.success) {
        showToast('Login สำเร็จ!', 'success');
      } else {
        showToast(`Login ไม่สำเร็จ: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
    setLoginLoading(null);
    loadData();
  }

  async function handleTestAi() {
    setTestingAi(true);
    try {
      const result = await api.testAiConnection();
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
    setTestingAi(false);
  }

  return (
    <div>
      <h1 className="page-title">⚙️ ตั้งค่า</h1>

      {/* Accounts */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="card-title" style={{ marginBottom: 0 }}>👤 บัญชี Facebook</div>
          <button className="btn btn-sm btn-primary" onClick={() => setShowAddAccount(true)}>➕ เพิ่มบัญชี</button>
        </div>

        {showAddAccount && (
          <div className="flex gap-2 mb-3">
            <input type="text" className="form-input flex-1" placeholder="ชื่อบัญชี (เช่น บัญชีหลัก)" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} />
            <button className="btn btn-success" onClick={handleAddAccount}>บันทึก</button>
            <button className="btn btn-secondary" onClick={() => setShowAddAccount(false)}>ยกเลิก</button>
          </div>
        )}

        {accounts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center gap-3" style={{ background: '#0f1322', padding: '12px 16px', borderRadius: '10px', border: '1px solid #2d3555' }}>
                <div className="flex-1">
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{acc.name}</div>
                  <div className="text-xs text-muted">
                    สถานะ: {acc.status === 'active' ? '🟢 ใช้งานได้' : '🔴 ไม่ได้ใช้'}
                    {acc.last_used_at && ` • ใช้ล่าสุด: ${acc.last_used_at}`}
                  </div>
                  <div className="text-xs text-muted">
                    {acc.storage_state ? '✅ มี session' : '⚠️ ยังไม่ได้ login'}
                  </div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => handleLogin(acc.id)} disabled={loginLoading === acc.id}>
                  {loginLoading === acc.id ? '⏳...' : '🔑 Login'}
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteAccount(acc.id)}>🗑️</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted" style={{ textAlign: 'center', padding: '20px' }}>ยังไม่มีบัญชี — กด "เพิ่มบัญชี" เพื่อเริ่มต้น</div>
        )}
      </div>

      {/* Safety settings */}
      <div className="card">
        <div className="card-title">🛡️ ความปลอดภัย</div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">แชร์สูงสุดต่อวัน (ต่อบัญชี)</label>
            <input type="number" className="form-input" value={settings.max_shares_per_day || 20} onChange={e => handleSettingChange('max_shares_per_day', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">หน่วงเวลาต่ำสุด (วินาที)</label>
            <input type="number" className="form-input" value={settings.delay_min || 120} onChange={e => handleSettingChange('delay_min', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">หน่วงเวลาสูงสุด (วินาที)</label>
            <input type="number" className="form-input" value={settings.delay_max || 300} onChange={e => handleSettingChange('delay_max', e.target.value)} />
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="card">
        <div className="card-title">🤖 AI Caption</div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Provider</label>
            <select className="form-select" value={settings.ai_provider || 'none'} onChange={e => handleSettingChange('ai_provider', e.target.value)}>
              <option value="none">ไม่ใช้</option>
              <option value="openrouter">OpenRouter</option>
              <option value="deepseek">DeepSeek</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Model</label>
            <input type="text" className="form-input" value={settings.ai_model || 'deepseek-chat'} onChange={e => handleSettingChange('ai_model', e.target.value)} placeholder="deepseek-chat" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">API Key</label>
          <input type="password" className="form-input" value={settings.ai_api_key || ''} onChange={e => handleSettingChange('ai_api_key', e.target.value)} placeholder="sk-..." />
        </div>
        <button className="btn btn-sm btn-secondary" onClick={handleTestAi} disabled={testingAi || settings.ai_provider === 'none'}>
          {testingAi ? '⏳ กำลังทดสอบ...' : '🧪 ทดสอบการเชื่อมต่อ'}
        </button>
      </div>
    </div>
  );
}
