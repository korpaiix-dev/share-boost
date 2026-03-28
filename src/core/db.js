const path = require('path');
const { app } = require('electron');
const fs = require('fs');

let initSqlJs;
try {
  initSqlJs = require('sql.js');
} catch (e) {
  console.error('sql.js not available');
  initSqlJs = null;
}

let db = null;
let dbPath = null;

function getDbPath() {
  try {
    return path.join(app.getPath('userData'), 'shareboost.db');
  } catch {
    return path.join(__dirname, '..', '..', 'shareboost.db');
  }
}

function saveDb() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Auto-save ทุก 30 วินาที
let saveInterval = null;

async function initDb() {
  if (db) return db;

  if (!initSqlJs) {
    console.warn('sql.js not available - running in mock mode');
    db = createMockDb();
    return db;
  }

  dbPath = getDbPath();
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  seedDefaults();
  saveDb();

  // Auto-save
  saveInterval = setInterval(saveDb, 30000);

  return db;
}

function run(sql, params = []) {
  try {
    db.run(sql, params);
    saveDb();
  } catch (e) {
    console.error('DB run error:', e.message, sql);
  }
}

function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } catch (e) {
    console.error('DB get error:', e.message);
    return null;
  }
}

function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (e) {
    console.error('DB all error:', e.message);
    return [];
  }
}

function lastId() {
  const row = get('SELECT last_insert_rowid() as id');
  return row ? row.id : 0;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      fb_user TEXT,
      cookies TEXT,
      storage_state TEXT,
      status TEXT DEFAULT 'active',
      last_used_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      fb_group_id TEXT,
      name TEXT,
      url TEXT,
      member_count INTEGER,
      category TEXT DEFAULT 'ทั่วไป',
      status TEXT DEFAULT 'active',
      last_shared_at TEXT,
      share_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      color TEXT DEFAULT '#3b82f6'
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS share_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      group_id INTEGER,
      post_url TEXT,
      caption TEXT,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      screenshot_path TEXT,
      shared_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS share_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT,
      account_id INTEGER,
      group_id INTEGER,
      post_url TEXT,
      post_text TEXT,
      caption TEXT,
      caption_style TEXT,
      use_ai_caption INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      scheduled_at TEXT,
      delay_seconds INTEGER DEFAULT 120,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
}

function seedDefaults() {
  const { DEFAULT_SETTINGS } = require('../shared/constants');
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
  }
  run('INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)', ['ทั่วไป', '#3b82f6']);
}

function createMockDb() {
  const store = {
    accounts: [],
    groups: [],
    categories: [{ id: 1, name: 'ทั่วไป', color: '#3b82f6' }],
    settings: { delay_min: '120', delay_max: '300', max_shares_per_day: '20', ai_provider: 'none', ai_api_key: '', ai_model: 'deepseek-chat', language: 'th' }
  };
  return { _store: store, _isMock: true };
}

// ========== API Functions ==========

function getSetting(key) {
  if (!db || db._isMock) return (db && db._store.settings[key]) || null;
  const row = get('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

function setSetting(key, value) {
  if (!db) return;
  if (db._isMock) { db._store.settings[key] = value; return; }
  run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
}

function getAllSettings() {
  if (!db || db._isMock) return (db && { ...db._store.settings }) || {};
  const rows = all('SELECT key, value FROM settings');
  const result = {};
  for (const row of rows) result[row.key] = row.value;
  return result;
}

function getAccounts() {
  if (!db || db._isMock) return [];
  return all('SELECT * FROM accounts ORDER BY created_at DESC');
}

function addAccount(name, fbUser) {
  if (!db || db._isMock) return { id: Date.now() };
  run('INSERT INTO accounts (name, fb_user) VALUES (?, ?)', [name, fbUser]);
  return { id: lastId() };
}

function updateAccountCookies(id, cookies, storageState) {
  if (!db || db._isMock) return;
  run('UPDATE accounts SET cookies = ?, storage_state = ?, last_used_at = datetime("now") WHERE id = ?',
    [typeof cookies === 'string' ? cookies : JSON.stringify(cookies),
     typeof storageState === 'string' ? storageState : JSON.stringify(storageState), id]);
}

function deleteAccount(id) {
  if (!db || db._isMock) return;
  run('DELETE FROM accounts WHERE id = ?', [id]);
}

function getGroups(accountId) {
  if (!db || db._isMock) return [];
  if (accountId) {
    return all('SELECT * FROM groups WHERE account_id = ? ORDER BY category, name', [accountId]);
  }
  return all('SELECT * FROM groups ORDER BY category, name');
}

function addGroup(data) {
  if (!db || db._isMock) return { id: Date.now() };
  // เช็คว่ามีอยู่แล้วไหม (ไม่ซ้ำ)
  const existing = get('SELECT id FROM groups WHERE account_id = ? AND fb_group_id = ?', 
    [data.account_id, data.fb_group_id]);
  if (existing) {
    // อัปเดตชื่อ/URL ถ้าเปลี่ยน
    run('UPDATE groups SET name = ?, url = ?, member_count = ? WHERE id = ?',
      [data.name, data.url, data.member_count, existing.id]);
    return { id: existing.id };
  }
  run('INSERT INTO groups (account_id, fb_group_id, name, url, member_count, category) VALUES (?, ?, ?, ?, ?, ?)',
    [data.account_id, data.fb_group_id, data.name, data.url, data.member_count, data.category || 'ทั่วไป']);
  return { id: lastId() };
}

function updateGroupCategory(groupIds, category) {
  if (!db || db._isMock) return;
  for (const id of groupIds) run('UPDATE groups SET category = ? WHERE id = ?', [category, id]);
}

function updateGroupStatus(id, status) {
  if (!db || db._isMock) return;
  run('UPDATE groups SET status = ? WHERE id = ?', [status, id]);
}

function deleteGroup(id) {
  if (!db || db._isMock) return;
  run('DELETE FROM groups WHERE id = ?', [id]);
}

function getCategories() {
  if (!db || db._isMock) return [{ id: 1, name: 'ทั่วไป', color: '#3b82f6' }];
  return all('SELECT * FROM categories ORDER BY name');
}

function addCategory(name, color) {
  if (!db || db._isMock) return { id: Date.now() };
  run('INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)', [name, color || '#3b82f6']);
  return { id: lastId() };
}

function updateCategory(id, name, color) {
  if (!db || db._isMock) return;
  run('UPDATE categories SET name = ?, color = ? WHERE id = ?', [name, color, id]);
}

function deleteCategory(id) {
  if (!db || db._isMock) return;
  run('UPDATE groups SET category = "ทั่วไป" WHERE category = (SELECT name FROM categories WHERE id = ?)', [id]);
  run('DELETE FROM categories WHERE id = ?', [id]);
}

function addShareHistory(data) {
  if (!db || db._isMock) return { id: Date.now() };
  run('INSERT INTO share_history (account_id, group_id, post_url, caption, status, error_message, screenshot_path, shared_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))',
    [data.account_id, data.group_id, data.post_url, data.caption, data.status, data.error_message, data.screenshot_path]);
  return { id: lastId() };
}

function getShareHistory(filters = {}) {
  if (!db || db._isMock) return [];
  let query = `SELECT sh.*, g.name as group_name, a.name as account_name
               FROM share_history sh
               LEFT JOIN groups g ON sh.group_id = g.id
               LEFT JOIN accounts a ON sh.account_id = a.id WHERE 1=1`;
  const params = [];
  if (filters.date) { query += ' AND date(sh.shared_at) = ?'; params.push(filters.date); }
  if (filters.status) { query += ' AND sh.status = ?'; params.push(filters.status); }
  query += ' ORDER BY sh.created_at DESC LIMIT 500';
  return all(query, params);
}

function getTodayStats(accountId) {
  if (!db || db._isMock) return { total: 0, success: 0, failed: 0, pending: 0 };
  // ใช้ช่วง 24 ชั่วโมงล่าสุด (ไม่ขึ้นกับ timezone)
  let query = `SELECT COUNT(*) as total,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN status = 'pending' OR status = 'sharing' THEN 1 ELSE 0 END) as pending
    FROM share_history WHERE shared_at >= datetime('now', '-24 hours')`;
  const params = [];
  if (accountId) { query += ' AND account_id = ?'; params.push(accountId); }
  return get(query, params) || { total: 0, success: 0, failed: 0, pending: 0 };
}

function getWeeklyStats() {
  if (!db || db._isMock) return [];
  return all(`SELECT date(shared_at) as date,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM share_history WHERE shared_at >= date('now', '-7 days')
    GROUP BY date(shared_at) ORDER BY date(shared_at)`);
}

function addToQueue(data) {
  if (!db || db._isMock) return { id: Date.now() };
  run(`INSERT INTO share_queue (batch_id, account_id, group_id, post_url, post_text, caption, caption_style, use_ai_caption, status, scheduled_at, delay_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [data.batch_id, data.account_id, data.group_id, data.post_url, data.post_text, data.caption, data.caption_style, data.use_ai_caption ? 1 : 0, data.scheduled_at, data.delay_seconds]);
  return { id: lastId() };
}

function getQueueItems(batchId) {
  if (!db || db._isMock) return [];
  if (batchId) {
    return all('SELECT sq.*, g.name as group_name FROM share_queue sq LEFT JOIN groups g ON sq.group_id = g.id WHERE sq.batch_id = ? ORDER BY sq.id', [batchId]);
  }
  return all('SELECT sq.*, g.name as group_name FROM share_queue sq LEFT JOIN groups g ON sq.group_id = g.id WHERE sq.status = "pending" ORDER BY sq.scheduled_at, sq.id');
}

function updateQueueItem(id, data) {
  if (!db || db._isMock) return;
  const sets = Object.entries(data).map(([k]) => `${k} = ?`).join(', ');
  run(`UPDATE share_queue SET ${sets} WHERE id = ?`, [...Object.values(data), id]);
}

function updateGroupShareCount(groupId, success) {
  if (!db || db._isMock) return;
  if (success) {
    run('UPDATE groups SET share_count = share_count + 1, last_shared_at = datetime("now") WHERE id = ?', [groupId]);
  } else {
    run('UPDATE groups SET fail_count = fail_count + 1 WHERE id = ?', [groupId]);
  }
}

function closeDb() {
  if (saveInterval) clearInterval(saveInterval);
  saveDb();
  if (db && !db._isMock) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDb, closeDb,
  getSetting, setSetting, getAllSettings,
  getAccounts, addAccount, updateAccountCookies, deleteAccount,
  getGroups, addGroup, updateGroupCategory, updateGroupStatus, deleteGroup,
  getCategories, addCategory, updateCategory, deleteCategory,
  addShareHistory, getShareHistory, getTodayStats, getWeeklyStats,
  addToQueue, getQueueItems, updateQueueItem, updateGroupShareCount
};
