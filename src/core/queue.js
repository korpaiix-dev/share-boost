const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const facebook = require('./facebook');
const { parseSpintax } = require('./spintax');
const aiCaption = require('./ai-caption');

let isRunning = false;
let shouldStop = false;
let currentBatchId = null;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createBatch({ accountId, groupIds, postUrl, postText, caption, captionStyle, useAiCaption, delayMin, delayMax, scheduleType, scheduledAt }) {
  const batchId = uuidv4();

  for (const groupId of groupIds) {
    const delay = randomInt(delayMin || 120, delayMax || 300);
    db.addToQueue({
      batch_id: batchId,
      account_id: accountId,
      group_id: groupId,
      post_url: postUrl || null,
      post_text: postText || null,
      caption: caption || '',
      caption_style: captionStyle || '',
      use_ai_caption: useAiCaption,
      scheduled_at: scheduledAt || new Date().toISOString(),
      delay_seconds: delay
    });
  }

  return batchId;
}

async function processBatch(batchId, { onProgress, onComplete, onError }) {
  if (isRunning) {
    if (onError) onError('มีงานกำลังทำงานอยู่แล้ว');
    return;
  }

  isRunning = true;
  shouldStop = false;
  currentBatchId = batchId;

  const items = db.getQueueItems(batchId);
  const total = items.length;
  let completed = 0;
  let successCount = 0;
  let failCount = 0;

  // เปิด browser ครั้งเดียว reuse ทุก group
  let browser = null;
  let context = null;

  try {
    // เตรียม account สำหรับ item แรก (ทุก item ใช้ account เดียวกัน)
    const firstItem = items[0];
    if (!firstItem) {
      if (onComplete) onComplete({ total: 0, successCount: 0, failCount: 0 });
      return;
    }
    const accounts = db.getAccounts();
    const account = accounts.find(a => a.id === firstItem.account_id);
    if (!account || !account.storage_state) {
      if (onError) onError('ไม่พบข้อมูลบัญชีหรือยังไม่ได้ login');
      return;
    }

    // เปิด browser + context ครั้งเดียว
    if (onProgress) onProgress({ current: 0, total, status: 'launching', message: 'กำลังเปิด browser...', successCount: 0, failCount: 0 });
    const session = await facebook.launchBrowserSession(account.storage_state);
    browser = session.browser;
    context = session.context;

    for (const item of items) {
      if (shouldStop) {
        db.updateQueueItem(item.id, { status: 'skipped' });
        continue;
      }

      db.updateQueueItem(item.id, { status: 'processing' });
      if (onProgress) onProgress({
        current: completed + 1,
        total,
        groupName: item.group_name,
        status: 'sharing',
        successCount,
        failCount
      });

      try {
        // Resolve caption
        let finalCaption = item.caption;

        if (item.use_ai_caption) {
          try {
            const settings = db.getAllSettings();
            finalCaption = await aiCaption.generateCaption(settings, {
              topic: item.caption,
              details: item.post_text || '',
              style: item.caption_style || 'announce',
              intensity: 'medium',
              length: 'medium',
              emojiLevel: 'medium'
            });
          } catch (aiErr) {
            console.error('AI Caption error:', aiErr);
          }
        } else {
          finalCaption = parseSpintax(finalCaption);
        }

        // Get group URL
        const groups = db.getGroups(item.account_id);
        const group = groups.find(g => g.id === item.group_id);
        const groupUrl = group ? group.url : `https://www.facebook.com/groups/${item.group_id}`;

        // Share โดยใช้ context เดิม (ไม่เปิด browser ใหม่)
        const result = await facebook.sharePostInContext(context, {
          groupUrl,
          caption: finalCaption,
          postUrl: item.post_url,
          onProgress: (p) => {
            if (onProgress) onProgress({
              current: completed + 1,
              total,
              groupName: item.group_name,
              status: p.step,
              message: p.message,
              successCount,
              failCount
            });
          }
        });

        if (result.success) {
          successCount++;
          db.updateQueueItem(item.id, { status: 'done', caption: finalCaption });
          db.addShareHistory({
            account_id: item.account_id,
            group_id: item.group_id,
            post_url: item.post_url,
            caption: finalCaption,
            status: 'success',
            screenshot_path: result.screenshotPath
          });
          db.updateGroupShareCount(item.group_id, true);
        } else {
          throw new Error(result.error || 'แชร์ไม่สำเร็จ');
        }
      } catch (err) {
        failCount++;
        db.updateQueueItem(item.id, { status: 'failed', error: err.message });
        db.addShareHistory({
          account_id: item.account_id,
          group_id: item.group_id,
          post_url: item.post_url,
          caption: item.caption,
          status: 'failed',
          error_message: err.message
        });
        db.updateGroupShareCount(item.group_id, false);
      }

      completed++;

      // Delay ระหว่างกลุ่ม
      if (completed < total && !shouldStop) {
        const delay = item.delay_seconds * 1000;
        if (onProgress) onProgress({
          current: completed,
          total,
          status: 'waiting',
          message: `รอ ${item.delay_seconds} วินาที ก่อนกลุ่มถัดไป...`,
          successCount,
          failCount
        });
        await sleep(delay);
      }
    }
  } finally {
    // ปิด browser หลังทำทุก group เสร็จ
    if (browser) {
      try { await browser.close(); } catch {}
    }
    isRunning = false;
    currentBatchId = null;
    if (onComplete) onComplete({ total, successCount, failCount });
  }
}

function stopBatch() {
  shouldStop = true;
}

function getStatus() {
  return { isRunning, currentBatchId };
}

module.exports = { createBatch, processBatch, stopBatch, getStatus };
