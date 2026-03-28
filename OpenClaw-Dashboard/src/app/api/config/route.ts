import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync, spawn } from 'child_process';

const CONFIG_PATH = path.join(os.homedir(), 'PageContent', 'dashboard_config.json');
const PAGES_DIR = path.join(os.homedir(), 'PageContent', 'pages');

interface PageConfig {
  id: string;
  name: string;
  pageId: string;
  accessToken: string;
  captionStyle?: string;
  keywords?: string;
  autoTrending?: boolean;
  schedule?: string[];
}

interface Config {
  captionStyle: string;
  emergencyStop: boolean;
  pages: PageConfig[];
}

function getConfig(): Config {
  if (fs.existsSync(CONFIG_PATH)) {
    try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch {}
  }
  return { captionStyle: 'sexy', emergencyStop: false, pages: [] };
}

function saveConfig(config: Config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function syncCronForPages(config: Config) {
  try {
    const result = spawnSync('/usr/bin/crontab', ['-l'], { encoding: 'utf8', shell: false });
    const currentCron = result.stdout || '';
    const NL = String.fromCharCode(10);
    const lines = currentCron.split(NL);

    // Keep non-post cron lines (health_check, reply_comments, analyze_page + any ESTOP lines)
    const keepLines = lines.filter(l => {
      if (!l.trim() || l.startsWith('#')) return true;
      // Keep health/pink/fah cron lines
      if (l.includes('health_check') || l.includes('reply_comments') || l.includes('analyze_page')) return true;
      // Remove old post_facebook lines (we'll regenerate)
      if (l.includes('post_facebook')) return false;
      return true;
    });

    // Add per-page post cron lines
    const postScript = path.join(os.homedir(), 'PageContent', 'post_facebook.py');
    const logDir = path.join(os.homedir(), 'PageContent');

    for (const page of config.pages) {
      if (!page.schedule || !page.schedule.length) continue;
      for (const time of page.schedule) {
        const [hour, minute] = time.split(':');
        const cronLine = `${parseInt(minute)} ${parseInt(hour)} * * * /usr/bin/python3 ${postScript} --page ${page.id} >> ${logDir}/cron_${page.id}.log 2>&1`;
        if (!config.emergencyStop) {
          keepLines.push(cronLine);
        } else {
          keepLines.push(`# ESTOP ${cronLine}`);
        }
      }
    }

    // Also keep main page if it has no page entry but has the old-style cron
    const mainPage = config.pages.find(p => p.id === 'main');
    if (!mainPage) {
      // Keep legacy main cron lines with original format for backward compat
    }

    const tmpFile = path.join(os.tmpdir(), 'cron_sync');
    fs.writeFileSync(tmpFile, keepLines.filter(l => l !== undefined).join(NL) + NL);
    spawnSync('/usr/bin/crontab', [tmpFile], { shell: false });
    fs.unlinkSync(tmpFile);
  } catch (e) {
    console.error('Cron sync error:', e);
  }
}

function bootstrapQueue(pageId: string) {
  try {
    const postScript = path.join(os.homedir(), 'PageContent', 'post_facebook.py');
    const child = spawn('/usr/bin/python3', [postScript, '--page', pageId, '--queue-only'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    console.log(`[bootstrapQueue] Spawned queue-only for page: ${pageId}`);
  } catch (e) {
    console.error('Bootstrap queue error:', e);
  }
}

export async function GET() {
  return NextResponse.json({ success: true, config: getConfig() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config = getConfig();

    if (body.captionStyle !== undefined) config.captionStyle = body.captionStyle;
    if (body.emergencyStop !== undefined) config.emergencyStop = body.emergencyStop;

    // Handle page operations
    if (body.action === 'addPage' && body.page) {
      // Generate slug: prefer first meaningful chars, fallback to pageId prefix
      let pageId = body.page.name
        .toLowerCase()
        .replace(/[^a-z0-9\u0E00-\u0E7F]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      if (!pageId || pageId.length < 2) {
        pageId = 'page-' + (body.page.pageId || '').slice(-6);
      }
      const newPage: PageConfig = {
        id: pageId,
        name: body.page.name,
        pageId: body.page.pageId,
        accessToken: body.page.accessToken || '',
        captionStyle: body.page.captionStyle || config.captionStyle,
        schedule: body.page.schedule || ['09:00', '19:30'],
        autoTrending: body.page.autoTrending ?? true
      };
      config.pages = config.pages.filter(p => p.id !== pageId);
      config.pages.push(newPage);

      // Create page directories
      fs.mkdirSync(path.join(PAGES_DIR, pageId, 'photos'), { recursive: true });
      fs.mkdirSync(path.join(PAGES_DIR, pageId, 'videos'), { recursive: true });

      // Auto-bootstrap queue for the new page
      saveConfig(config);
      bootstrapQueue(pageId);
    }

    if (body.action === 'removePage' && body.pageId) {
      config.pages = config.pages.filter(p => p.id !== body.pageId);
    }

    if (body.action === 'updatePageSchedule' && body.pageId && body.schedule) {
      const page = config.pages.find(p => p.id === body.pageId);
      if (page) {
        page.schedule = body.schedule;
        // If this page has no queue yet, bootstrap it
        const queuePath = path.join(PAGES_DIR, body.pageId, 'queue.json');
        if (!fs.existsSync(queuePath)) {
          saveConfig(config);
          bootstrapQueue(body.pageId);
        }
      }
    }

    if (body.action === 'updatePageStyle' && body.pageId && body.captionStyle) {
      const page = config.pages.find(p => p.id === body.pageId);
      if (page) page.captionStyle = body.captionStyle;
    }

    if (body.action === 'updatePageKeywords' && body.pageId !== undefined) {
      const page = config.pages.find(p => p.id === body.pageId);
      if (page) page.keywords = body.keywords || '';
    }

    if (body.action === 'updatePageAutoTrending' && body.pageId !== undefined) {
      const page = config.pages.find(p => p.id === body.pageId);
      if (page) page.autoTrending = body.autoTrending;
    }

    if (body.pages !== undefined && !body.action) {
      config.pages = body.pages;
    }

    saveConfig(config);

    // Sync cron whenever config changes
    if (body.emergencyStop !== undefined || body.action === 'addPage' || body.action === 'removePage' || body.action === 'updatePageSchedule') {
      syncCronForPages(config);
    }

    // Handle legacy emergency stop for non-page crons
    if (body.emergencyStop !== undefined) {
      try {
        const estopResult = spawnSync('/usr/bin/crontab', ['-l'], { encoding: 'utf8', shell: false });
        const currentCron = estopResult.stdout || '';
        const NL = String.fromCharCode(10);
        const lines = currentCron.split(NL);
        const updated = lines.map((l: string) => {
          if (body.emergencyStop === true) {
            if (l.trim() && !l.startsWith('#') && (l.includes('reply_comments') || l.includes('analyze_page'))) {
              return `# ESTOP ${l}`;
            }
          } else {
            if (l.startsWith('# ESTOP ')) return l.replace('# ESTOP ', '');
          }
          return l;
        });
        const tmpFile = path.join(os.tmpdir(), 'cron_estop2');
        fs.writeFileSync(tmpFile, updated.join(NL));
        spawnSync('/usr/bin/crontab', [tmpFile], { shell: false });
        fs.unlinkSync(tmpFile);
      } catch {}
    }

    return NextResponse.json({ success: true, config });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
