const path = require('path');

let playwrightCore;
try {
  playwrightCore = require('playwright-core');
} catch {
  console.warn('playwright-core not available');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function launchBrowser(storageState) {
  if (!playwrightCore) throw new Error('playwright-core ไม่พร้อมใช้งาน');

  const viewportWidth = 1366 + randomInt(-20, 20);
  const viewportHeight = 768 + randomInt(-20, 20);

  const launchOptions = {
    headless: false, // ให้ user เห็นหน้าจอเสมอ (Windows มีจอ)
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      `--window-size=${viewportWidth},${viewportHeight}`
    ]
  };

  // หา Chrome/Edge บน Windows
  const fs = require('fs');
  const possiblePaths = [
    // Windows Chrome
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // Windows Edge
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    // Linux
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ].filter(Boolean);

  let browser;
  // ลอง default ก่อน (ถ้ามี playwright browsers installed)
  try {
    browser = await playwrightCore.chromium.launch(launchOptions);
  } catch {
    // ลองหา Chrome/Edge ที่ติดตั้งอยู่
    for (const execPath of possiblePaths) {
      try {
        if (fs.existsSync(execPath)) {
          browser = await playwrightCore.chromium.launch({ ...launchOptions, executablePath: execPath });
          console.log('ใช้ browser:', execPath);
          break;
        }
      } catch { continue; }
    }
    if (!browser) throw new Error('ไม่พบ Chrome หรือ Edge browser — กรุณาติดตั้ง Google Chrome');
  }

  const contextOptions = {
    viewport: { width: viewportWidth, height: viewportHeight },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok'
  };

  if (storageState) {
    try {
      let parsed = storageState;
      // อาจถูก stringify หลายรอบ — parse จนได้ object
      while (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      contextOptions.storageState = parsed;
    } catch (e) {
      console.warn('ไม่สามารถ parse storageState:', e.message);
    }
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  return { browser, context, page };
}

async function loginAccount(existingStorageState) {
  const { browser, context, page } = await launchBrowser(existingStorageState);

  try {
    await page.goto('https://www.facebook.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);

    // Check if already logged in
    const isLoggedIn = await page.evaluate(() => {
      return document.querySelector('[aria-label="Your profile"]') !== null ||
             document.querySelector('[aria-label="โปรไฟล์ของคุณ"]') !== null ||
             document.querySelector('div[role="navigation"]') !== null;
    });

    if (isLoggedIn) {
      const storageState = await context.storageState();
      const cookies = await context.cookies();
      await browser.close();
      return { success: true, cookies, storageState: JSON.stringify(storageState) };
    }

    // Wait for user to login manually
    console.log('กรุณา login Facebook ด้วยตัวเอง...');

    // Wait up to 5 minutes for login
    await page.waitForFunction(() => {
      return document.querySelector('[aria-label="Your profile"]') !== null ||
             document.querySelector('[aria-label="โปรไฟล์ของคุณ"]') !== null ||
             window.location.href.includes('facebook.com/?sk=') ||
             (document.querySelector('div[role="navigation"]') !== null && !window.location.href.includes('/login'));
    }, { timeout: 300000 });

    await sleep(3000);
    const storageState = await context.storageState();
    const cookies = await context.cookies();
    await browser.close();
    return { success: true, cookies, storageState: JSON.stringify(storageState) };
  } catch (err) {
    await browser.close().catch(() => {});
    return { success: false, error: err.message };
  }
}


async function dumpPageInfo(page, label) {
  try {
    const fs = require('fs');
    const p = require('path');
    let debugDir;
    try { const { app } = require('electron'); debugDir = p.join(app.getPath('userData'), 'debug'); }
    catch { debugDir = p.join(__dirname, '..', '..', 'debug'); }
    fs.mkdirSync(debugDir, { recursive: true });
    const ts = Date.now();
    await page.screenshot({ path: p.join(debugDir, label + '_' + ts + '.png'), fullPage: false });
    const domInfo = await page.evaluate(() => {
      const info = { url: location.href, title: document.title, groupLinks: [], buttons: [] };
      document.querySelectorAll('a[href*="/groups/"]').forEach(a => {
        const m = a.href.match(/\/groups\/(\d+)/);
        if (m) info.groupLinks.push({ id: m[1], text: a.textContent.trim().substring(0,60) });
      });
      document.querySelectorAll('[role="button"], button').forEach(el => {
        const t = el.textContent?.trim();
        if (t && t.length < 60) info.buttons.push({ text: t, aria: el.getAttribute('aria-label') || '' });
      });
      return info;
    });
    const unique = new Map();
    domInfo.groupLinks.forEach(g => { if (g.text.length > 1) unique.set(g.id, g.text); });
    domInfo.uniqueGroups = Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    domInfo.uniqueCount = unique.size;
    fs.writeFileSync(p.join(debugDir, label + '_' + ts + '.json'), JSON.stringify(domInfo, null, 2));
    console.log('[DEBUG] ' + label + ': ' + unique.size + ' unique groups, saved to ' + debugDir);
    return domInfo;
  } catch (e) { console.error('[DEBUG]', e.message); return null; }
}

async function fetchGroups(storageState, onProgress) {
  const { browser, context, page } = await launchBrowser(storageState);
  const allGroups = new Map();

  function collectGroups(found) {
    found.forEach(g => {
      const existing = allGroups.get(g.fb_group_id);
      if (!existing) {
        allGroups.set(g.fb_group_id, g);
      } else if (g.name.length > existing.name.length) {
        // อัปเดตชื่อถ้าเจอชื่อยาวกว่า (ดีกว่า)
        existing.name = g.name;
      }
    });
  }

  const extractGroupsFromPage = async () => {
    return await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/groups/"]');
      const groupMap = new Map(); // id -> best name
      const skipIds = new Set(['joins', 'feed', 'search', 'discover', 'create', 'notifications', 'settings']);
      const skipNames = new Set(['ดูกลุ่ม', 'View group', '']);
      
      links.forEach(link => {
        const href = link.href;
        const matchNumeric = href.match(/\/groups\/(\d+)/);
        const matchSlug = href.match(/\/groups\/([a-zA-Z0-9._-]+)\/?$/);
        const groupId = matchNumeric ? matchNumeric[1] : (matchSlug ? matchSlug[1] : null);
        
        if (!groupId || skipIds.has(groupId)) return;
        
        // ดึงชื่อ — ลบ "ใช้งานล่าสุด..." ออก
        const nameEl = link.querySelector('span') || link;
        let name = nameEl.textContent?.trim() || '';
        
        // ตัด "ใช้งานล่าสุด..." ออก
        const lastUsedIdx = name.indexOf('ใช้งานล่าสุด');
        if (lastUsedIdx > 0) name = name.substring(0, lastUsedIdx).trim();
        
        // ข้าม "ดูกลุ่ม" และชื่อสั้นเกินไป
        if (skipNames.has(name) || name.length < 2 || name === 'Group title pending') return;
        
        // เก็บชื่อที่ดีที่สุด (ยาวที่สุดที่ไม่มี "ใช้งานล่าสุด")
        const existing = groupMap.get(groupId);
        if (!existing || name.length > existing.name.length) {
          groupMap.set(groupId, {
            fb_group_id: groupId,
            name: name,
            url: 'https://www.facebook.com/groups/' + groupId,
            member_count: 0
          });
        }
      });
      
      return Array.from(groupMap.values());
    });
  };

  async function scrollAndCollect(maxScrolls = 50, scrollPauseMs = 2500) {
    let lastCount = 0;
    let scrollAttempts = 0;
    let noChangeCount = 0;

    while (scrollAttempts < maxScrolls) {
      // Smooth scroll
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
      await sleep(scrollPauseMs);

      // รอ network idle เล็กน้อย
      try {
        await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
      } catch {}

      const currentGroups = await extractGroupsFromPage();
      collectGroups(currentGroups);

      const currentCount = allGroups.size;
      if (currentCount === lastCount) {
        noChangeCount++;
        if (noChangeCount >= 5) break;
      } else {
        noChangeCount = 0;
      }
      lastCount = currentCount;

      if (onProgress) onProgress({ count: allGroups.size });
      scrollAttempts++;
    }
  }

  try {
    // ใช้ /groups/joins/ เป็นหลัก — หน้านี้มี list กลุ่มทั้งหมด
    try {
      await page.goto('https://www.facebook.com/groups/joins/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(4000);
      await dumpPageInfo(page, 'fetchGroups_0');

      // ลอง click "ดูทั้งหมด" / "See all" ถ้ามี
      try {
        const seeAllSelectors = [
          'span:has-text("ดูทั้งหมด")',
          'span:has-text("See all")',
          'a:has-text("ดูทั้งหมด")',
          'div[role="button"]:has-text("ดูทั้งหมด")'
        ];
        for (const sel of seeAllSelectors) {
          try {
            await page.click(sel, { timeout: 2000 });
            await sleep(2000);
            break;
          } catch { continue; }
        }
      } catch {}

      // Scroll นาน + รอให้โหลดครบ
      await scrollAndCollect(80, 2000);
      if (onProgress) onProgress({ count: allGroups.size });
      await dumpPageInfo(page, 'fetchGroups_after_scroll');
    } catch (e) {
      console.warn('fetchGroups joins/ error:', e.message);
    }

    // ลอง /groups/?tab=groups ด้วย (UI ต่างจาก joins)
    try {
      await page.goto('https://www.facebook.com/groups/?tab=groups', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(4000);
      await dumpPageInfo(page, 'fetchGroups_tab');
      await scrollAndCollect(30, 2000);
      if (onProgress) onProgress({ count: allGroups.size });
    } catch (e) {
      console.warn('fetchGroups tab error:', e.message);
    }

    const groups = Array.from(allGroups.values());
    await browser.close();
    return { success: true, groups };
  } catch (err) {
    const groups = Array.from(allGroups.values());
    await browser.close().catch(() => {});
    return { success: false, error: err.message, groups };
  }
}

async function humanType(page, selector, text) {
  const element = await page.waitForSelector(selector, { timeout: 10000 });
  await element.click();
  await sleep(randomInt(300, 800));

  for (const char of text) {
    await page.keyboard.type(char, { delay: randomInt(50, 150) });
    if (Math.random() < 0.05) await sleep(randomInt(200, 500));
  }
}

async function sharePost({ storageState, groupUrl, caption, postUrl, imagePath, onProgress, screenshotDir }) {
  const { browser, context, page } = await launchBrowser(storageState);

  try {
    if (onProgress) onProgress({ step: 'navigating', message: `กำลังไปหน้ากลุ่ม...` });

    await page.goto(groupUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(randomInt(2000, 4000));

    // Random scroll
    await page.evaluate(() => window.scrollBy(0, Math.random() * 300));
    await sleep(randomInt(500, 1500));

    // Debug: dump DOM ก่อนเริ่มแชร์
    await dumpPageInfo(page, 'sharePost_before');
    
    if (onProgress) onProgress({ step: 'opening_composer', message: 'กำลังเปิดช่องโพสต์...' });

    // Scroll ขึ้นบนสุดเพื่อหาช่อง compose
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(2000);

    // คลิกที่ช่อง "เขียนอะไรบางอย่าง..." เพื่อเปิด dialog สร้างโพสต์
    let dialogOpened = false;
    const composeTriggers = [
      'span:has-text("เขียนอะไรบางอย่าง")',
      'span:has-text("เขียนอะไรสักอย่าง")',
      'span:has-text("Write something")',
      'div[role="button"]:has(span:has-text("เขียน"))',
    ];

    for (const sel of composeTriggers) {
      try {
        await page.click(sel, { timeout: 5000 });
        dialogOpened = true;
        break;
      } catch { continue; }
    }

    if (!dialogOpened) {
      // Fallback: หา placeholder text
      try {
        const composeArea = await page.locator('div[role="button"]').filter({ hasText: /เขียน|Write/ }).first();
        await composeArea.click({ timeout: 5000 });
        dialogOpened = true;
      } catch {}
    }

    // รอ dialog "สร้างโพสต์" เปิดขึ้น
    await sleep(2000);
    try {
      await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
      if (onProgress) onProgress({ step: 'dialog_opened', message: 'เปิดหน้าสร้างโพสต์แล้ว' });
    } catch {
      if (onProgress) onProgress({ step: 'dialog_failed', message: 'ไม่สามารถเปิดหน้าสร้างโพสต์ได้' });
    }

    await sleep(randomInt(1000, 2000));

    // หาช่องพิมพ์ใน dialog — role="textbox" contenteditable="true"
    const textboxInDialog = 'div[role="dialog"] div[role="textbox"][contenteditable="true"]';
    const textboxFallback = 'div[role="textbox"][contenteditable="true"]';

    let editor;
    try {
      editor = await page.waitForSelector(textboxInDialog, { timeout: 5000 });
    } catch {
      try {
        editor = await page.waitForSelector(textboxFallback, { timeout: 5000 });
      } catch {
        throw new Error('ไม่พบช่องพิมพ์โพสต์');
      }
    }

    await editor.click();
    await sleep(500);

    // พิมพ์ caption
    if (caption) {
      if (onProgress) onProgress({ step: 'typing', message: 'กำลังพิมพ์ caption...' });

      for (const char of caption) {
        await page.keyboard.type(char, { delay: randomInt(50, 150) });
        if (Math.random() < 0.03) await sleep(randomInt(200, 600));
      }
      await sleep(randomInt(500, 1500));
    }

    // วาง URL ถ้ามี
    if (postUrl) {
      if (onProgress) onProgress({ step: 'pasting_url', message: 'กำลังวาง URL...' });
      if (caption) {
        await page.keyboard.press('Enter');
        await sleep(500);
      }
      await page.keyboard.type(postUrl, { delay: randomInt(10, 30) });
      await sleep(randomInt(3000, 5000)); // รอ preview โหลด
    }

    // Screenshot ก่อนโพสต์
    if (screenshotDir) {
      const ssPath = path.join(screenshotDir, `pre_post_${Date.now()}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
    }

    if (onProgress) onProgress({ step: 'posting', message: 'กำลังกดโพสต์...' });

    // กดปุ่ม "โพสต์" — อยู่ใน dialog, role="button", text="โพสต์"
    let posted = false;
    const postBtnSelectors = [
      'div[role="dialog"] div[role="button"]:has-text("โพสต์"):not(:has-text("โพสต์แบบ")):not(:has-text("ไม่ระบุ"))',
      'div[role="dialog"] div[role="button"] >> text="โพสต์"',
      'div[role="dialog"] span:has-text("โพสต์")',
    ];

    for (const sel of postBtnSelectors) {
      try {
        // หาปุ่มโพสต์ที่อยู่ด้านล่างสุดของ dialog
        const buttons = await page.locator(sel).all();
        for (const btn of buttons) {
          const text = await btn.textContent();
          // ต้องเป็นปุ่มที่เขียนว่า "โพสต์" เท่านั้น (ไม่ใช่ "โพสต์แบบไม่ระบุตัวตน")
          if (text.trim() === 'โพสต์' || text.trim() === 'Post') {
            await btn.click({ timeout: 5000 });
            posted = true;
            break;
          }
        }
        if (posted) break;
      } catch { continue; }
    }

    if (!posted) {
      // Fallback: Ctrl+Enter
      await page.keyboard.press('Control+Enter');
    }

    // รอ dialog ปิด (= โพสต์สำเร็จ)
    await sleep(3000);
    try {
      await page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 15000 });
      if (onProgress) onProgress({ step: 'posted', message: 'โพสต์สำเร็จ! dialog ปิดแล้ว' });
    } catch {
      // dialog อาจยังเปิดอยู่ = อาจยังไม่ได้โพสต์
      if (onProgress) onProgress({ step: 'uncertain', message: 'ไม่แน่ใจว่าโพสต์สำเร็จหรือไม่' });
    }

    await sleep(randomInt(2000, 4000));

    // Take screenshot after posting
    let screenshotPath = null;
    if (screenshotDir) {
      screenshotPath = path.join(screenshotDir, `post_${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
    }

    if (onProgress) onProgress({ step: 'done', message: 'โพสต์สำเร็จ!' });

    await browser.close();
    return { success: true, screenshotPath };
  } catch (err) {
    let screenshotPath = null;
    if (screenshotDir) {
      try {
        screenshotPath = path.join(screenshotDir, `error_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      } catch {}
    }
    await browser.close().catch(() => {});
    return { success: false, error: err.message, screenshotPath };
  }
}

async function searchAndJoinGroups(storageState, keyword, maxGroups = 10) {
  const { browser, context, page } = await launchBrowser(storageState);
  const joinedGroups = [];

  try {
    // ค้นหากลุ่มผ่าน Facebook Search
    const searchUrl = `https://www.facebook.com/search/groups/?q=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    // รอหน้าค้นหาโหลด
    await sleep(5000);

    // Scroll เพื่อโหลดกลุ่มเพิ่ม
    let scrollAttempts = 0;
    const maxScrolls = 10;
    while (scrollAttempts < maxScrolls) {
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
      await sleep(2000);
      scrollAttempts++;
    }

    // ค้นหาปุ่ม "เข้าร่วม" / "Join"
    const joinButtons = await page.$$('div[role="button"], a[role="button"], button');
    let joinCount = 0;

    for (const btn of joinButtons) {
      if (joinCount >= maxGroups) break;

      try {
        const text = await btn.textContent();
        const trimmed = text.trim();
        if (trimmed === 'เข้าร่วมกลุ่ม' || trimmed === 'เข้าร่วม' || trimmed === 'Join' || trimmed === 'Join group' || trimmed === 'Join Group') {
          // หาชื่อกลุ่มจาก parent
          let groupName = 'ไม่ทราบชื่อ';
          try {
            const parent = await btn.evaluateHandle(el => {
              let node = el;
              for (let i = 0; i < 8; i++) {
                node = node.parentElement;
                if (!node) break;
              }
              return node;
            });
            const nameEl = await parent.$('a span, h2, h3, strong');
            if (nameEl) {
              groupName = (await nameEl.textContent()).trim() || groupName;
            }
          } catch {}

          await btn.click();
          joinCount++;
          joinedGroups.push({ name: groupName, status: 'joined' });

          // Random delay 3-10 วินาที
          await sleep(randomInt(3000, 10000));
        }
      } catch { continue; }
    }

    await browser.close();
    return { success: true, joinedGroups, totalFound: joinButtons.length, totalJoined: joinCount };
  } catch (err) {
    await browser.close().catch(() => {});
    return { success: false, error: err.message, joinedGroups };
  }
}

// เปิด browser session เดียวสำหรับแชร์หลาย group
async function launchBrowserSession(storageState) {
  const { browser, context } = await launchBrowser(storageState);
  return { browser, context };
}

// แชร์โพสต์โดยใช้ context ที่เปิดไว้แล้ว (ไม่เปิด browser ใหม่)
async function sharePostInContext(context, { groupUrl, caption, postUrl, imagePath, onProgress, screenshotDir }) {
  // เปิด page ใหม่ใน context เดิม
  const page = await context.newPage();

  try {
    if (onProgress) onProgress({ step: 'navigating', message: `กำลังไปหน้ากลุ่ม...` });

    await page.goto(groupUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(randomInt(2000, 4000));

    await page.evaluate(() => window.scrollBy(0, Math.random() * 300));
    await sleep(randomInt(500, 1500));

    await dumpPageInfo(page, 'sharePost_before');

    if (onProgress) onProgress({ step: 'opening_composer', message: 'กำลังเปิดช่องโพสต์...' });

    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(2000);

    let dialogOpened = false;
    const composeTriggers = [
      'span:has-text("เขียนอะไรบางอย่าง")',
      'span:has-text("เขียนอะไรสักอย่าง")',
      'span:has-text("Write something")',
      'div[role="button"]:has(span:has-text("เขียน"))',
    ];

    for (const sel of composeTriggers) {
      try {
        await page.click(sel, { timeout: 5000 });
        dialogOpened = true;
        break;
      } catch { continue; }
    }

    if (!dialogOpened) {
      try {
        const composeArea = await page.locator('div[role="button"]').filter({ hasText: /เขียน|Write/ }).first();
        await composeArea.click({ timeout: 5000 });
        dialogOpened = true;
      } catch {}
    }

    await sleep(2000);
    try {
      await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
      if (onProgress) onProgress({ step: 'dialog_opened', message: 'เปิดหน้าสร้างโพสต์แล้ว' });
    } catch {
      if (onProgress) onProgress({ step: 'dialog_failed', message: 'ไม่สามารถเปิดหน้าสร้างโพสต์ได้' });
    }

    await sleep(randomInt(1000, 2000));

    const textboxInDialog = 'div[role="dialog"] div[role="textbox"][contenteditable="true"]';
    const textboxFallback = 'div[role="textbox"][contenteditable="true"]';

    let editor;
    try {
      editor = await page.waitForSelector(textboxInDialog, { timeout: 5000 });
    } catch {
      try {
        editor = await page.waitForSelector(textboxFallback, { timeout: 5000 });
      } catch {
        throw new Error('ไม่พบช่องพิมพ์โพสต์');
      }
    }

    await editor.click();
    await sleep(500);

    if (caption) {
      if (onProgress) onProgress({ step: 'typing', message: 'กำลังพิมพ์ caption...' });
      for (const char of caption) {
        await page.keyboard.type(char, { delay: randomInt(50, 150) });
        if (Math.random() < 0.03) await sleep(randomInt(200, 600));
      }
      await sleep(randomInt(500, 1500));
    }

    if (postUrl) {
      if (onProgress) onProgress({ step: 'pasting_url', message: 'กำลังวาง URL...' });
      if (caption) {
        await page.keyboard.press('Enter');
        await sleep(500);
      }
      await page.keyboard.type(postUrl, { delay: randomInt(10, 30) });
      await sleep(randomInt(3000, 5000));
    }

    if (onProgress) onProgress({ step: 'posting', message: 'กำลังกดโพสต์...' });

    let posted = false;
    const postBtnSelectors = [
      'div[role="dialog"] div[role="button"]:has-text("โพสต์"):not(:has-text("โพสต์แบบ")):not(:has-text("ไม่ระบุ"))',
      'div[role="dialog"] div[role="button"] >> text="โพสต์"',
      'div[role="dialog"] span:has-text("โพสต์")',
    ];

    for (const sel of postBtnSelectors) {
      try {
        const buttons = await page.locator(sel).all();
        for (const btn of buttons) {
          const text = await btn.textContent();
          if (text.trim() === 'โพสต์' || text.trim() === 'Post') {
            await btn.click({ timeout: 5000 });
            posted = true;
            break;
          }
        }
        if (posted) break;
      } catch { continue; }
    }

    if (!posted) {
      await page.keyboard.press('Control+Enter');
    }

    await sleep(3000);
    try {
      await page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 15000 });
      if (onProgress) onProgress({ step: 'posted', message: 'โพสต์สำเร็จ! dialog ปิดแล้ว' });
    } catch {
      if (onProgress) onProgress({ step: 'uncertain', message: 'ไม่แน่ใจว่าโพสต์สำเร็จหรือไม่' });
    }

    await sleep(randomInt(2000, 4000));

    let screenshotPath = null;
    if (screenshotDir) {
      screenshotPath = path.join(screenshotDir, `post_${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
    }

    if (onProgress) onProgress({ step: 'done', message: 'โพสต์สำเร็จ!' });

    // ปิดเฉพาะ page (ไม่ปิด browser)
    await page.close();
    return { success: true, screenshotPath };
  } catch (err) {
    let screenshotPath = null;
    if (screenshotDir) {
      try {
        screenshotPath = path.join(screenshotDir, `error_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      } catch {}
    }
    await page.close().catch(() => {});
    return { success: false, error: err.message, screenshotPath };
  }
}

module.exports = { launchBrowser, launchBrowserSession, loginAccount, fetchGroups, sharePost, sharePostInContext, humanType, searchAndJoinGroups };
