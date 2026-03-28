const db = require('./db');
const facebook = require('./facebook');

async function addNewAccount(name) {
  const result = db.addAccount(name, '');
  return result;
}

async function loginToAccount(accountId) {
  const accounts = db.getAccounts();
  const account = accounts.find(a => a.id === accountId);

  const storageState = account?.storage_state || null;
  const loginResult = await facebook.loginAccount(storageState);

  if (loginResult.success) {
    db.updateAccountCookies(accountId, loginResult.cookies, loginResult.storageState);
    return { success: true };
  }

  return { success: false, error: loginResult.error };
}

async function fetchAccountGroups(accountId) {
  const accounts = db.getAccounts();
  const account = accounts.find(a => a.id === accountId);

  if (!account || !account.storage_state) {
    return { success: false, error: 'ยังไม่ได้ login บัญชีนี้' };
  }

  const result = await facebook.fetchGroups(account.storage_state);

  if (result.groups && result.groups.length > 0) {
    for (const group of result.groups) {
      db.addGroup({
        account_id: accountId,
        fb_group_id: group.fb_group_id,
        name: group.name,
        url: group.url,
        member_count: group.member_count
      });
    }
  }

  return result;
}

function removeAccount(accountId) {
  db.deleteAccount(accountId);
}

module.exports = { addNewAccount, loginToAccount, fetchAccountGroups, removeAccount };
