const { useState, useEffect } = React;

// Mock API for when running without Electron
const mockApi = {
  getSettings: async () => ({ delay_min: '120', delay_max: '300', max_shares_per_day: '20', ai_provider: 'none', ai_api_key: '', ai_model: 'deepseek-chat', language: 'th' }),
  setSetting: async () => true,
  getAccounts: async () => [],
  addAccount: async (name) => ({ id: Date.now() }),
  deleteAccount: async () => true,
  loginAccount: async () => ({ success: false, error: 'ไม่สามารถ login ในโหมดนี้' }),
  getGroups: async () => [],
  fetchGroups: async () => ({ success: false, error: 'ไม่สามารถดึงกลุ่มในโหมดนี้' }),
  updateGroupCategory: async () => true,
  updateGroupStatus: async () => true,
  deleteGroup: async () => true,
  getCategories: async () => [{ id: 1, name: 'ทั่วไป', color: '#3b82f6' }],
  addCategory: async () => ({ id: Date.now() }),
  updateCategory: async () => true,
  deleteCategory: async () => true,
  getShareHistory: async () => [],
  getTodayStats: async () => ({ total: 0, success: 0, failed: 0, pending: 0 }),
  getWeeklyStats: async () => [],
  generateCaptions: async () => ['ตัวอย่าง caption 1', 'ตัวอย่าง caption 2', 'ตัวอย่าง caption 3'],
  testAiConnection: async () => ({ success: false, message: 'ไม่สามารถทดสอบในโหมดนี้' }),
  startSharing: async () => 'mock-batch',
  stopSharing: async () => true,
  getQueueStatus: async () => ({ isRunning: false }),
  onShareProgress: () => {},
  onShareComplete: () => {},
  onShareError: () => {}
};

const api = window.api || mockApi;

function App() {
  const [currentPage, setCurrentPage] = useState('share');
  const [toast, setToast] = useState(null);
  const [shareProgress, setShareProgress] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    api.onShareProgress((data) => {
      setShareProgress(data);
    });
    api.onShareComplete((data) => {
      setIsSharing(false);
      setShareProgress(null);
      showToast(`แชร์เสร็จสิ้น! สำเร็จ ${data.successCount}/${data.total}`, 'success');
    });
    api.onShareError((error) => {
      setIsSharing(false);
      showToast(`เกิดข้อผิดพลาด: ${error}`, 'error');
    });
  }, []);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function renderPage() {
    const props = { api, showToast, shareProgress, isSharing, setIsSharing, setShareProgress };
    switch (currentPage) {
      case 'share': return React.createElement(SharePage, props);
      case 'groups': return React.createElement(GroupsPage, props);
      case 'report': return React.createElement(ReportPage, props);
      case 'settings': return React.createElement(SettingsPage, props);
      default: return React.createElement(SharePage, props);
    }
  }

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="main-content">
        {renderPage()}
      </div>
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
}
