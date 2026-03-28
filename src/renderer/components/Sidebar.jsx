function Sidebar({ currentPage, onNavigate }) {
  const menuItems = [
    { id: 'share', label: 'แชร์โพสต์', icon: '🚀' },
    { id: 'groups', label: 'จัดการกลุ่ม', icon: '👥' },
    { id: 'report', label: 'รายงาน', icon: '📊' },
    { id: 'settings', label: 'ตั้งค่า', icon: '⚙️' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>ShareBoost</h1>
        <span>Facebook Group Share Tool</span>
      </div>
      <div className="sidebar-menu">
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 20px', borderTop: '1px solid #2d3555', fontSize: '11px', color: '#475569' }}>
        v1.0.0
      </div>
    </div>
  );
}
