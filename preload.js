const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // Accounts
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  addAccount: (name) => ipcRenderer.invoke('add-account', name),
  deleteAccount: (id) => ipcRenderer.invoke('delete-account', id),
  loginAccount: (id) => ipcRenderer.invoke('login-account', id),

  // Groups
  getGroups: (accountId) => ipcRenderer.invoke('get-groups', accountId),
  fetchGroups: (accountId) => ipcRenderer.invoke('fetch-groups', accountId),
  updateGroupCategory: (groupIds, category) => ipcRenderer.invoke('update-group-category', groupIds, category),
  updateGroupStatus: (groupId, status) => ipcRenderer.invoke('update-group-status', groupId, status),
  deleteGroup: (id) => ipcRenderer.invoke('delete-group', id),

  searchJoinGroups: (accountId, keyword, maxGroups) => ipcRenderer.invoke('search-join-groups', accountId, keyword, maxGroups),

  // Categories
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (name, color) => ipcRenderer.invoke('add-category', name, color),
  updateCategory: (id, name, color) => ipcRenderer.invoke('update-category', id, name, color),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),

  // Share History & Stats
  getShareHistory: (filters) => ipcRenderer.invoke('get-share-history', filters),
  getTodayStats: (accountId) => ipcRenderer.invoke('get-today-stats', accountId),
  getWeeklyStats: () => ipcRenderer.invoke('get-weekly-stats'),

  // AI Caption
  generateCaptions: (params) => ipcRenderer.invoke('generate-captions', params),
  testAiConnection: () => ipcRenderer.invoke('test-ai-connection'),

  // Queue & Sharing
  startSharing: (params) => ipcRenderer.invoke('start-sharing', params),
  stopSharing: () => ipcRenderer.invoke('stop-sharing'),
  getQueueStatus: () => ipcRenderer.invoke('get-queue-status'),

  // Debug
  openDebugFolder: () => ipcRenderer.invoke('open-debug-folder'),
  getDebugFiles: () => ipcRenderer.invoke('get-debug-files'),

  // Events
  onShareProgress: (callback) => {
    ipcRenderer.on('share-progress', (event, data) => callback(data));
  },
  onShareComplete: (callback) => {
    ipcRenderer.on('share-complete', (event, data) => callback(data));
  },
  onShareError: (callback) => {
    ipcRenderer.on('share-error', (event, data) => callback(data));
  }
});
