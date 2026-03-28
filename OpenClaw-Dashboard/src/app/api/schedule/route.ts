import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
const SCRIPT_PATH = path.join(os.homedir(), 'PageContent', 'post_facebook.py');

function buildCronLine(hour: string, min: string, pageId: string): string {
  const logPath = path.join(os.homedir(), 'PageContent', `cron_${pageId}.log`);
  return `${min} ${hour} * * * /usr/bin/python3 ${SCRIPT_PATH} --page ${pageId} >> ${logPath} 2>&1`;
}

function getCurrentCrontab(): string {
  try {
    const result = spawnSync('/usr/bin/crontab', ['-l'], { encoding: 'utf8', shell: false });
    return result.stdout || '';
  } catch {
    return '';
  }
}

interface CronJob {
  time: string;
  command: string;
  pageId: string;
  active: boolean;
}

function parseCronJobs(cronOutput: string): CronJob[] {
  return cronOutput.split(String.fromCharCode(10))
    .filter(line => line.trim() && !line.startsWith('#') && line.includes('post_facebook'))
    .map(line => {
      const parts = line.trim().split(/\s+/);
      const min = parts[0];
      const hour = parts[1];
      // Extract --page argument
      const pageMatch = line.match(/--page\s+(\S+)/);
      const pageId = pageMatch ? pageMatch[1] : 'main';
      return {
        time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`,
        command: parts.slice(5).join(' '),
        pageId,
        active: true
      };
    });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filterPageId = searchParams.get('pageId');

    const cronOutput = getCurrentCrontab();
    let jobs = parseCronJobs(cronOutput);

    // Filter by page if specified
    if (filterPageId) {
      jobs = jobs.filter(j => j.pageId === filterPageId);
    }

    // Read ALL cron logs (per-page + legacy)
    const logDir = path.join(os.homedir(), 'PageContent');
    let logs: string[] = [];

    // Try per-page log files
    const logFiles = fs.readdirSync(logDir).filter(f => f.startsWith('cron') && f.endsWith('.log'));
    for (const logFile of logFiles) {
      const logPath = path.join(logDir, logFile);
      if (fs.existsSync(logPath)) {
        try {
          const logContent = fs.readFileSync(logPath, 'utf8');
          const lines = logContent.split(String.fromCharCode(10)).filter(Boolean);
          // Tag each line with source
          const pageName = logFile.replace('cron_', '').replace('cron', '').replace('.log', '') || 'main';
          lines.forEach(l => {
            if (filterPageId && pageName !== filterPageId) return;
            logs.push(`[${pageName}] ${l}`);
          });
        } catch {}
      }
    }
    // Sort by newest first, limit 50
    logs = logs.slice(-50).reverse();

    // Queue info from pages
    let nextPost = null;
    const configPath = path.join(os.homedir(), 'PageContent', 'dashboard_config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        for (const page of (config.pages || [])) {
          if (filterPageId && page.id !== filterPageId) continue;
          const queuePath = path.join(os.homedir(), 'PageContent', 'pages', page.id, 'queue.json');
          if (fs.existsSync(queuePath)) {
            const queueData = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
            if (queueData.nextPost && queueData.nextPost.filename) {
              const lowerName = queueData.nextPost.filename.toLowerCase();
              const isVideo = lowerName.endsWith('.mp4') || lowerName.endsWith('.mov');
              nextPost = {
                filename: queueData.nextPost.filename,
                caption: queueData.nextPost.caption,
                type: isVideo ? 'video' : 'photo',
                pageName: page.name,
                url: `/api/media/file?path=pages/${page.id}/${isVideo ? 'videos' : 'photos'}/${encodeURIComponent(queueData.nextPost.filename)}`
              };
              break;
            }
          }
        }
      } catch {}
    }

    return NextResponse.json({ success: true, jobs, logs, nextPost });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const bodyContent = await req.json();
    const { action, time, oldTime, pageId, caption, albumFiles } = bodyContent;
    const effectivePageId = pageId || 'main';

    // Handle caption update actions (no crontab needed)
    if (action === 'updateCaption') {
      const queuePath = path.join(os.homedir(), 'PageContent', 'pages', effectivePageId, 'queue.json');
      if (!fs.existsSync(queuePath)) return NextResponse.json({ success: false, error: 'No queue found' }, { status: 404 });
      const queueData = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
      if (queueData.nextPost) queueData.nextPost.caption = caption;
      fs.writeFileSync(queuePath, JSON.stringify(queueData, null, 2));
      return NextResponse.json({ success: true, message: 'แคปชั่นอัปเดตแล้ว', caption });
    }

    if (action === 'deleteQueue') {
      const queuePath = path.join(os.homedir(), 'PageContent', 'pages', effectivePageId, 'queue.json');
      if (fs.existsSync(queuePath)) {
        const queueData = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
        queueData.nextPost = null;
        fs.writeFileSync(queuePath, JSON.stringify(queueData, null, 2));
      }
      return NextResponse.json({ success: true, message: 'ยกเลิกคิวสำเร็จ' });
    }

    if (action === 'randomizeQueue') {
      const scriptPath = path.join(os.homedir(), 'PageContent', 'post_facebook.py');
      try {
        const result = spawnSync('/usr/bin/python3', [scriptPath, '--page', effectivePageId, '--queue-only'], {
          encoding: 'utf8',
          shell: false
        });
        if (result.error) {
          return NextResponse.json({ success: false, error: `Spawn error: ${result.error.message}` });
        }
        if (result.status !== 0) {
          return NextResponse.json({ success: false, error: `Script error: ${result.stderr}` });
        }
        return NextResponse.json({ success: true, message: 'สุ่มคิวใหม่สำเร็จ' });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
      }
    }

    if (action === 'queueAlbum') {
      const files = albumFiles || [];
      if (!files.length) return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });

      const queuePath = path.join(os.homedir(), 'PageContent', 'pages', effectivePageId, 'queue.json');
      const queueData = fs.existsSync(queuePath) ? JSON.parse(fs.readFileSync(queuePath, 'utf8')) : {};
      
      queueData.nextPost = {
        type: 'album',
        filename: files[0], // primary reference
        albumFiles: files,
        caption: caption || '',
        file_path: '' // Will be resolved by python script
      };
      
      fs.writeFileSync(queuePath, JSON.stringify(queueData, null, 2));
      return NextResponse.json({ success: true, message: 'บันทึกคิวอัลบั้มสำเร็จ' });
    }

    if (action === 'refreshCaption') {
      const queuePath = path.join(os.homedir(), 'PageContent', 'pages', effectivePageId, 'queue.json');
      if (!fs.existsSync(queuePath)) return NextResponse.json({ success: false, error: 'No queue found' }, { status: 404 });
      const queueData = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
      if (!queueData.nextPost?.filename) return NextResponse.json({ success: false, error: 'No next post' }, { status: 404 });

      // Read config for keywords + style
      const configPath = path.join(os.homedir(), 'PageContent', 'dashboard_config.json');
      let keywords = '', captionStyle = 'sexy';
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const pageConfig = (config.pages || []).find((p: { id: string }) => p.id === effectivePageId);
        if (pageConfig) { keywords = pageConfig.keywords || ''; captionStyle = pageConfig.captionStyle || 'sexy'; }
      }

      // Read OpenRouter key
      const authContent = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.openclaw', 'agents', 'main', 'agent', 'auth-profiles.json'), 'utf8'));
      const openRouterKey = authContent.profiles['openrouter:default']?.key;
      const promptText = fs.readFileSync(path.join(os.homedir(), '.openclaw', 'facebook_system_prompt.txt'), 'utf8');

      const styleMap: Record<string, string> = {
        sexy: 'เซ็กซี่ ดึงดูด ขี้เล่น', cute: 'น่ารัก สดใส อ่อนหวาน', funny: 'ตลก ขำขัน มีมุก',
        sell: 'ขายดี CTA แรง โน้มน้าว', classy: 'หรูหรา ดูแพง พรีเมียม'
      };
      const styleTone = styleMap[captionStyle] || styleMap.sexy;
      const filename = queueData.nextPost.filename;
      const isVideo = filename.toLowerCase().endsWith('.mp4') || filename.toLowerCase().endsWith('.mov');

      let promptExtra = `สไตล์แคปชั่น: ${styleTone}`;
      if (keywords) promptExtra += `\nคีย์เวิร์ดที่ต้องปรากฏในแคปชั่น: ${keywords}`;

      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'system', content: promptText }, { role: 'user', content: `คุณคือแอดมินเพจ ให้แต่งแคปชั่น Facebook ภาษาไทย 1 โพสต์ สำหรับ${isVideo ? 'วิดีโอ' : 'รูปภาพ'}นี้ ความยาว 3-6 บรรทัด พร้อมแฮชแท็ก 3-5 ตัว\n\n${promptExtra}\n\nข้อบังคับ: ห้ามมีคำอารัมภบท ส่งมาแค่ตัวสเตตัสเพียวๆ ห้ามเอาชื่อไฟล์มาใช้` }]
        })
      });

      let newCaption = queueData.nextPost.caption;
      if (orRes.ok) {
        const orData = await orRes.json();
        if (orData.choices?.[0]?.message?.content) newCaption = orData.choices[0].message.content.trim();
      }
      queueData.nextPost.caption = newCaption;
      fs.writeFileSync(queuePath, JSON.stringify(queueData, null, 2));
      return NextResponse.json({ success: true, caption: newCaption, message: 'สร้างแคปชั่นใหม่แล้ว' });
    }

    const cronOutput = getCurrentCrontab();
    const NL = String.fromCharCode(10);
    const allLines = cronOutput.split(NL);

    // Separate our post_facebook lines from other cron entries
    const otherLines = allLines.filter(l => l.trim() && !l.includes('post_facebook'));
    const postLines = allLines.filter(l => l.trim() && l.includes('post_facebook'));

    // Only operate on lines for this pageId
    const thisPageLines = postLines.filter(l => {
      const m = l.match(/--page\s+(\S+)/);
      return (m ? m[1] : 'main') === effectivePageId;
    });
    const otherPageLines = postLines.filter(l => {
      const m = l.match(/--page\s+(\S+)/);
      return (m ? m[1] : 'main') !== effectivePageId;
    });

    const mutableLines = [...thisPageLines];

    if (action === 'add') {
      const [hour, min] = time.split(':');
      const newLine = buildCronLine(hour, min, effectivePageId);
      const existing = parseCronJobs(mutableLines.join(NL));
      if (existing.some(j => j.time === time)) {
        return NextResponse.json({ success: false, error: `เวลา ${time} มีอยู่แล้ว` }, { status: 400 });
      }
      mutableLines.push(newLine);
    } else if (action === 'delete') {
      const [hour, min] = time.split(':');
      const targetPrefix = `${min} ${hour} `;
      const idx = mutableLines.findIndex(l => l.trim().startsWith(targetPrefix));
      if (idx === -1) {
        return NextResponse.json({ success: false, error: `ไม่พบเวลา ${time}` }, { status: 404 });
      }
      mutableLines.splice(idx, 1);
    } else if (action === 'edit') {
      const [oldHour, oldMin] = oldTime.split(':');
      const targetPrefix = `${oldMin} ${oldHour} `;
      const idx = mutableLines.findIndex(l => l.trim().startsWith(targetPrefix));
      if (idx === -1) {
        return NextResponse.json({ success: false, error: `ไม่พบเวลาเดิม ${oldTime}` }, { status: 404 });
      }
      const [newHour, newMin] = time.split(':');
      mutableLines[idx] = buildCronLine(newHour, newMin, effectivePageId);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Rebuild crontab with all pages
    const newCrontab = [...otherLines, ...otherPageLines, ...mutableLines].filter(Boolean).join(NL) + NL;
    
    const tmpFile = path.join(os.tmpdir(), 'crontab_tmp');
    fs.writeFileSync(tmpFile, newCrontab);
    spawnSync('/usr/bin/crontab', [tmpFile], { shell: false });
    fs.unlinkSync(tmpFile);

    // Save reference
    const crontabTxt = path.join(os.homedir(), 'PageContent', 'crontab.txt');
    fs.writeFileSync(crontabTxt, [...otherPageLines, ...mutableLines].join(NL) + NL);

    const jobs = parseCronJobs(mutableLines.join(NL));
    return NextResponse.json({ success: true, jobs, message: `${action} สำเร็จ` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
