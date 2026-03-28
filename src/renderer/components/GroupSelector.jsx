const { useState, useEffect } = React;

function GroupSelector({ api, accountId, selectedGroups, onSelectionChange }) {
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    loadData();
  }, [accountId]);

  async function loadData() {
    try {
      const [grps, cats] = await Promise.all([
        api.getGroups(accountId),
        api.getCategories()
      ]);
      setGroups(grps);
      setCategories(cats);
      // Expand all categories by default
      const expanded = {};
      cats.forEach(c => expanded[c.name] = true);
      setExpandedCategories(expanded);
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  }

  function toggleGroup(groupId) {
    const newSelection = selectedGroups.includes(groupId)
      ? selectedGroups.filter(id => id !== groupId)
      : [...selectedGroups, groupId];
    onSelectionChange(newSelection);
  }

  function toggleCategory(categoryName) {
    const categoryGroups = filteredGroups.filter(g => g.category === categoryName);
    const categoryGroupIds = categoryGroups.map(g => g.id);
    const allSelected = categoryGroupIds.every(id => selectedGroups.includes(id));

    let newSelection;
    if (allSelected) {
      newSelection = selectedGroups.filter(id => !categoryGroupIds.includes(id));
    } else {
      const toAdd = categoryGroupIds.filter(id => !selectedGroups.includes(id));
      newSelection = [...selectedGroups, ...toAdd];
    }
    onSelectionChange(newSelection);
  }

  function toggleExpandCategory(categoryName) {
    setExpandedCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  }

  function selectAll() {
    onSelectionChange(filteredGroups.map(g => g.id));
  }

  function deselectAll() {
    onSelectionChange([]);
  }

  const filteredGroups = groups.filter(g => {
    if (g.status === 'banned') return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groupsByCategory = {};
  filteredGroups.forEach(g => {
    const cat = g.category || 'ทั่วไป';
    if (!groupsByCategory[cat]) groupsByCategory[cat] = [];
    groupsByCategory[cat].push(g);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">เลือกแล้ว {selectedGroups.length} กลุ่ม</span>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-secondary" onClick={selectAll}>เลือกทั้งหมด</button>
          <button className="btn btn-sm btn-secondary" onClick={deselectAll}>ยกเลิกทั้งหมด</button>
        </div>
      </div>

      <input
        type="text"
        className="form-input mb-3"
        placeholder="🔍 ค้นหากลุ่ม..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {Object.entries(groupsByCategory).map(([categoryName, categoryGroups]) => {
          const allSelected = categoryGroups.every(g => selectedGroups.includes(g.id));
          const someSelected = categoryGroups.some(g => selectedGroups.includes(g.id));
          const isExpanded = expandedCategories[categoryName] !== false;
          const cat = categories.find(c => c.name === categoryName);

          return (
            <div key={categoryName} className="group-category">
              <div className="group-category-header" onClick={() => toggleExpandCategory(categoryName)}>
                <span style={{ cursor: 'pointer', fontSize: '12px' }}>{isExpanded ? '▼' : '►'}</span>
                <div
                  className={`checkbox ${allSelected ? 'checked' : ''}`}
                  style={{ opacity: someSelected && !allSelected ? 0.5 : 1 }}
                  onClick={(e) => { e.stopPropagation(); toggleCategory(categoryName); }}
                />
                <span style={{ color: cat?.color || '#3b82f6' }}>{categoryName}</span>
                <span className="text-xs text-muted">({categoryGroups.length})</span>
              </div>
              {isExpanded && (
                <div className="group-list">
                  {categoryGroups.map(group => (
                    <div key={group.id} className="group-item" onClick={() => toggleGroup(group.id)}>
                      <div className={`checkbox ${selectedGroups.includes(group.id) ? 'checked' : ''}`} />
                      <span className="group-item-name">{group.name}</span>
                      <span className="group-item-members">
                        {group.member_count ? `${group.member_count.toLocaleString()} สมาชิก` : ''}
                      </span>
                      <span style={{ fontSize: '10px' }}>
                        {group.status === 'active' ? '🟢' : group.status === 'warning' ? '🟡' : '🔴'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(groupsByCategory).length === 0 && (
          <div className="text-sm text-muted" style={{ textAlign: 'center', padding: '30px' }}>
            {groups.length === 0 ? 'ยังไม่มีกลุ่ม — ไปที่หน้า "จัดการกลุ่ม" เพื่อดึงกลุ่ม' : 'ไม่พบกลุ่มที่ค้นหา'}
          </div>
        )}
      </div>
    </div>
  );
}
