function GroupsPage({ api, showToast }) {
  const { useState, useEffect } = React;
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMoveCategoryModal, setShowMoveCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [editCategory, setEditCategory] = useState(null);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#eab308', '#ef4444', '#06b6d4', '#6366f1', '#14b8a6'];

  useEffect(() => { loadData(); }, [selectedAccount]);

  async function loadData() {
    const [accs, cats] = await Promise.all([api.getAccounts(), api.getCategories()]);
    setAccounts(accs);
    setCategories(cats);
    if (accs.length > 0 && !selectedAccount) setSelectedAccount(accs[0].id);
    if (selectedAccount) {
      const grps = await api.getGroups(selectedAccount);
      setGroups(grps);
    }
  }

  async function handleFetchGroups() {
    if (!selectedAccount) { showToast('กรุณาเลือกบัญชี', 'error'); return; }
    setFetching(true);
    try {
      const result = await api.fetchGroups(selectedAccount);
      if (result.success) {
        showToast(`ดึงกลุ่มสำเร็จ ${result.groups?.length || 0} กลุ่ม`, 'success');
        await loadData();
      } else {
        showToast(`ดึงกลุ่มไม่สำเร็จ: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
    setFetching(false);
  }

  function toggleGroupSelect(id) {
    setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleChangeCategory(category) {
    if (selectedGroupIds.length === 0) { showToast('กรุณาเลือกกลุ่มก่อน', 'error'); return; }
    await api.updateGroupCategory(selectedGroupIds, category);
    setSelectedGroupIds([]);
    setShowMoveCategoryModal(false);
    showToast('ย้ายหมวดสำเร็จ', 'success');
    loadData();
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    if (editCategory) {
      await api.updateCategory(editCategory.id, newCategoryName, newCategoryColor);
    } else {
      await api.addCategory(newCategoryName, newCategoryColor);
    }
    setNewCategoryName('');
    setNewCategoryColor('#3b82f6');
    setEditCategory(null);
    setShowCategoryModal(false);
    showToast(editCategory ? 'แก้ไขหมวดสำเร็จ' : 'เพิ่มหมวดสำเร็จ', 'success');
    loadData();
  }

  async function handleDeleteCategory(id) {
    await api.deleteCategory(id);
    showToast('ลบหมวดสำเร็จ', 'success');
    loadData();
  }

  async function handleDeleteGroup(id) {
    await api.deleteGroup(id);
    showToast('ลบกลุ่มสำเร็จ', 'success');
    loadData();
  }

  async function handleStatusChange(id, status) {
    await api.updateGroupStatus(id, status);
    loadData();
  }

  const filteredGroups = groups.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== 'all' && g.category !== filterCategory) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title" style={{ marginBottom: 0 }}>👥 จัดการกลุ่ม</h1>
        <div className="flex gap-2">
          <select className="form-select" style={{ width: 'auto' }} value={selectedAccount || ''} onChange={e => setSelectedAccount(Number(e.target.value))}>
            <option value="">-- เลือกบัญชี --</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handleFetchGroups} disabled={fetching}>
            {fetching ? '⏳ กำลังดึง...' : '🔄 ดึงกลุ่มใหม่'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <input type="text" className="form-input" style={{ width: '300px' }} placeholder="🔍 ค้นหากลุ่ม..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select" style={{ width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">ทุกหมวด</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowCategoryModal(true)}>➕ เพิ่มหมวด</button>
          {selectedGroupIds.length > 0 && (
            <button className="btn btn-sm btn-primary" onClick={() => setShowMoveCategoryModal(true)}>
              📁 ย้ายหมวด ({selectedGroupIds.length})
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-2" style={{ background: '#0f1322', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, display: 'inline-block' }}></span>
              <span>{cat.name}</span>
              <span className="text-muted">({groups.filter(g => g.category === cat.name).length})</span>
              <span style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => { setEditCategory(cat); setNewCategoryName(cat.name); setNewCategoryColor(cat.color); setShowCategoryModal(true); }}>✏️</span>
              {cat.name !== 'ทั่วไป' && <span style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => handleDeleteCategory(cat.id)}>🗑️</span>}
            </div>
          ))}
        </div>

        {/* Groups table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>ชื่อกลุ่ม</th>
                <th>สมาชิก</th>
                <th>หมวด</th>
                <th>สถานะ</th>
                <th>แชร์ล่าสุด</th>
                <th>สำเร็จ/ล้มเหลว</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map(group => (
                <tr key={group.id}>
                  <td>
                    <div className={`checkbox ${selectedGroupIds.includes(group.id) ? 'checked' : ''}`} onClick={() => toggleGroupSelect(group.id)} />
                  </td>
                  <td>
                    <div className="text-sm" style={{ fontWeight: 500 }}>{group.name}</div>
                    <div className="text-xs text-muted">{group.url}</div>
                  </td>
                  <td>{group.member_count ? group.member_count.toLocaleString() : '-'}</td>
                  <td>
                    <span className="badge badge-info">{group.category || 'ทั่วไป'}</span>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', background: 'transparent', border: 'none' }}
                      value={group.status}
                      onChange={e => handleStatusChange(group.id, e.target.value)}
                    >
                      <option value="active">🟢 ใช้ได้</option>
                      <option value="warning">🟡 ระวัง</option>
                      <option value="banned">🔴 โดนแบน</option>
                    </select>
                  </td>
                  <td className="text-xs text-muted">{group.last_shared_at || '-'}</td>
                  <td className="text-xs">
                    <span className="text-success">{group.share_count}</span> / <span className="text-danger">{group.fail_count}</span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteGroup(group.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredGroups.length === 0 && (
            <div className="text-sm text-muted" style={{ textAlign: 'center', padding: '30px' }}>
              {groups.length === 0 ? 'ยังไม่มีกลุ่ม — กด "ดึงกลุ่มใหม่" เพื่อเริ่มต้น' : 'ไม่พบกลุ่มที่ค้นหา'}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => { setShowCategoryModal(false); setEditCategory(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editCategory ? '✏️ แก้ไขหมวด' : '➕ เพิ่มหมวดใหม่'}</div>
            <div className="form-group">
              <label className="form-label">ชื่อหมวด</label>
              <input type="text" className="form-input" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="เช่น ขายของ, ข่าว..." />
            </div>
            <div className="form-group">
              <label className="form-label">สี</label>
              <div className="color-options">
                {COLORS.map(color => (
                  <div key={color} className={`color-dot ${newCategoryColor === color ? 'selected' : ''}`} style={{ background: color }} onClick={() => setNewCategoryColor(color)} />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowCategoryModal(false); setEditCategory(null); }}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleAddCategory}>{editCategory ? 'บันทึก' : 'เพิ่ม'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Move Category Modal */}
      {showMoveCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowMoveCategoryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📁 ย้ายหมวด ({selectedGroupIds.length} กลุ่ม)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(cat => (
                <button key={cat.id} className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }} onClick={() => handleChangeCategory(cat.name)}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, display: 'inline-block' }}></span>
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowMoveCategoryModal(false)}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
