const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'ShareBoost',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#0f1322'
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  // Open DevTools in dev
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  // Init database
  try {
    db = require('./src/core/db');
    await db.initDb();
  } catch (err) {
    console.error('DB init error:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (db) db.closeDb();
  if (process.platform !== 'darwin') app.quit();
});

// ========== IPC Handlers ==========

// Settings
ipcMain.handle('get-settings', () => {
  return db.getAllSettings();
});

ipcMain.handle('set-setting', (event, key, value) => {
  db.setSetting(key, value);
  return true;
});

// Accounts
ipcMain.handle('get-accounts', () => {
  return db.getAccounts();
});

ipcMain.handle('add-account', (event, name) => {
  return db.addAccount(name, '');
});

ipcMain.handle('delete-account', (event, id) => {
  db.deleteAccount(id);
  return true;
});

ipcMain.handle('login-account', async (event, accountId) => {
  const account = require('./src/core/account');
  return await account.loginToAccount(accountId);
});

// Groups
ipcMain.handle('get-groups', (event, accountId) => {
  return db.getGroups(accountId);
});

ipcMain.handle('fetch-groups', async (event, accountId) => {
  const account = require('./src/core/account');
  return await account.fetchAccountGroups(accountId);
});

ipcMain.handle('update-group-category', (event, groupIds, category) => {
  db.updateGroupCategory(groupIds, category);
  return true;
});

ipcMain.handle('update-group-status', (event, groupId, status) => {
  db.updateGroupStatus(groupId, status);
  return true;
});

ipcMain.handle('delete-group', (event, id) => {
  db.deleteGroup(id);
  return true;
});

// Categories
ipcMain.handle('get-categories', () => {
  return db.getCategories();
});

ipcMain.handle('add-category', (event, name, color) => {
  return db.addCategory(name, color);
});

ipcMain.handle('update-category', (event, id, name, color) => {
  db.updateCategory(id, name, color);
  return true;
});

ipcMain.handle('delete-category', (event, id) => {
  db.deleteCategory(id);
  return true;
});

// Share History & Stats
ipcMain.handle('get-share-history', (event, filters) => {
  return db.getShareHistory(filters);
});

ipcMain.handle('get-today-stats', (event, accountId) => {
  return db.getTodayStats(accountId);
});

ipcMain.handle('get-weekly-stats', () => {
  return db.getWeeklyStats();
});

// AI Caption
ipcMain.handle('generate-captions', async (event, params) => {
  const aiCaption = require('./src/core/ai-caption');
  const settings = db.getAllSettings();
  return await aiCaption.generateMultipleCaptions(settings, params);
});

ipcMain.handle('test-ai-connection', async () => {
  const aiCaption = require('./src/core/ai-caption');
  const settings = db.getAllSettings();
  return await aiCaption.testConnection(settings);
});

// Search & Join Groups
ipcMain.handle('search-join-groups', async (event, accountId, keyword, maxGroups) => {
  const acc = db.getAccounts().find(a => a.id === accountId);
  if (!acc || !acc.storage_state) return { success: false, error: 'บัญชีไม่มี session — กรุณา Login ก่อน' };
  const facebook = require('./src/core/facebook');
  return await facebook.searchAndJoinGroups(acc.storage_state, keyword, maxGroups);
});

// Queue & Sharing
ipcMain.handle('start-sharing', async (event, params) => {
  const queue = require('./src/core/queue');

  const batchId = await queue.createBatch(params);

  // Process in background
  queue.processBatch(batchId, {
    onProgress: (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('share-progress', progress);
      }
    },
    onComplete: (result) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('share-complete', result);
      }
    },
    onError: (error) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('share-error', error);
      }
    }
  });

  return batchId;
});

ipcMain.handle('stop-sharing', () => {
  const queue = require('./src/core/queue');
  queue.stopBatch();
  return true;
});

ipcMain.handle('get-queue-status', () => {
  const queue = require('./src/core/queue');
  return queue.getStatus();
});

// Debug: เปิด folder debug files
ipcMain.handle('open-debug-folder', () => {
  const fs = require('fs');
  let debugDir;
  try { debugDir = require('path').join(app.getPath('userData'), 'debug'); }
  catch { debugDir = require('path').join(__dirname, 'debug'); }
  
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }
  
  require('electron').shell.openPath(debugDir);
  return debugDir;
});

// Debug: ดู debug JSON files
ipcMain.handle('get-debug-files', () => {
  const fs = require('fs');
  let debugDir;
  try { debugDir = require('path').join(app.getPath('userData'), 'debug'); }
  catch { debugDir = require('path').join(__dirname, 'debug'); }
  
  if (!fs.existsSync(debugDir)) return [];
  
  return fs.readdirSync(debugDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .slice(-10)
    .map(f => {
      const content = fs.readFileSync(require('path').join(debugDir, f), 'utf-8');
      return { name: f, data: JSON.parse(content) };
    });
});
