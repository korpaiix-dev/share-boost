import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const STYLE_MAP: Record<string, string> = {
  sexy: 'เซ็กซี่ ดึงดูด ขี้เล่น', cute: 'น่ารัก สดใส อ่อนหวาน', funny: 'ตลก ขำขัน มีมุก',
  sell: 'ขายดี CTA แรง โน้มน้าว', classy: 'หรูหรา ดูแพง พรีเมียม'
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, type, pageId, captionStyle, keywords, customCaption, albumFiles } = body;
    const isAlbum = albumFiles && Array.isArray(albumFiles) && albumFiles.length > 1;

    if (!filename && !isAlbum) return NextResponse.json({ success: false, error: 'Missing filename' }, { status: 400 });

    const baseDir = path.join(os.homedir(), 'PageContent');
    const effectivePageId = pageId || 'main';
    const pageDir = path.join(baseDir, 'pages', effectivePageId);

    // Load FB credentials from config
    let fbPageId = '', fbToken = '', configKeywords = '', configStyle = 'sexy';
    const configPath = path.join(baseDir, 'dashboard_config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const pageConfig = (config.pages || []).find((p: { id: string }) => p.id === effectivePageId);
        if (pageConfig && pageConfig.accessToken) {
          fbPageId = pageConfig.pageId;
          fbToken = pageConfig.accessToken;
          configKeywords = pageConfig.keywords || '';
          configStyle = pageConfig.captionStyle || 'sexy';
        }
      } catch {}
    }

    // Fallback to .env only if no config token
    if (!fbToken) {
      const envContent = fs.readFileSync(path.join(os.homedir(), '.openclaw', '.env'), 'utf8');
      envContent.split(String.fromCharCode(10)).forEach(line => {
        const t = line.trim();
        if (t.startsWith('FACEBOOK_PAGE_ID=')) fbPageId = t.substring('FACEBOOK_PAGE_ID='.length).trim();
        if (t.startsWith('FACEBOOK_ACCESS_TOKEN=')) fbToken = t.substring('FACEBOOK_ACCESS_TOKEN='.length).trim();
      });
    }

    const authContent = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.openclaw', 'agents', 'main', 'agent', 'auth-profiles.json'), 'utf8'));
    const openRouterKey = authContent.profiles['openrouter:default']?.key;
    const promptText = fs.readFileSync(path.join(os.homedir(), '.openclaw', 'facebook_system_prompt.txt'), 'utf8');

    // Use request keywords if provided, otherwise use config keywords
    const effectiveKeywords = keywords !== undefined ? keywords : configKeywords;
    const effectiveStyle = captionStyle || configStyle;
    const styleTone = STYLE_MAP[effectiveStyle] || STYLE_MAP.sexy;

    // Determine caption
    let caption = customCaption || '';

    if (!caption) {
      // Generate AI caption
      const mediaType = type === 'video' ? 'วิดีโอ' : 'รูปภาพ';
      let promptExtra = `สไตล์แคปชั่น: ${styleTone}`;
      if (effectiveKeywords) promptExtra += `\nคีย์เวิร์ดที่ต้องปรากฏในแคปชั่น: ${effectiveKeywords}`;

      const messageContent: { type: string; text?: string; image_url?: { url: string } }[] = [
        {
          type: 'text',
          text: `คุณคือแอดมินเพจ ให้แต่งแคปชั่น Facebook ภาษาไทย 1 โพสต์ สำหรับ${mediaType}นี้ ความยาว 3-6 บรรทัด พร้อมแฮชแท็ก 3-5 ตัว\n\n${promptExtra}\n\n**ข้อบังคับสำคัญ:**\n1. แคปชั่นต้องดึงดูด น่าสนใจ ขี้เล่นนิดๆ แต่ไม่หยาบคาย\n2. ห้ามมีคำอารัมภบท ส่งมาแค่ตัวสเตตัสเพียวๆ\n3. **ห้ามเอาชื่อไฟล์ ชื่อ username หรือตัวเลขจากชื่อไฟล์มาใช้เป็นชื่อคนหรืออ้างอิงใดๆ ในแคปชั่นโดยเด็ดขาด** ให้เขียนแคปชั่นทั่วไปที่ไม่ระบุชื่อใคร`
        }
      ];

      const mainFile = isAlbum ? albumFiles[0] : filename;
      const folder = type === 'video' ? 'videos' : 'photos';
      const filePath = path.join(pageDir, folder, mainFile);

      if (type === 'photo' && fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');
        const ext = path.extname(mainFile).toLowerCase().replace('.', '');
        const mimeType = ext === 'jpg' ? 'jpeg' : ext;
        messageContent.push({ type: 'image_url', image_url: { url: `data:image/${mimeType};base64,${base64Data}` } });
      }

      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'system', content: promptText }, { role: 'user', content: messageContent }]
        })
      });

      caption = "แวะมาทักทายค่ะทุกคน 💕 ✨ #สาวสวย #งานดี";
      if (orRes.ok) {
        const orData = await orRes.json();
        if (orData.choices?.[0]?.message) caption = orData.choices[0].message.content.trim();
        const usage = orData.usage || {};
        try {
          const logPath = path.join(baseDir, 'credit_log.json');
          const existing = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
          existing.push({
            timestamp: new Date().toISOString(), agent: 'agent-mint',
            action: `แต่งแคปชั่น: ${mainFile}`, model: 'gemini-2.5-flash',
            pageId: effectivePageId,
            tokens_input: usage.prompt_tokens || 0, tokens_output: usage.completion_tokens || 0,
            cost_usd: (usage.prompt_tokens || 0) * 0.00000015 + (usage.completion_tokens || 0) * 0.0000006
          });
          fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));
        } catch {}
      }
    }

    // Post to Facebook
    let postId = '';

    if (isAlbum && type === 'photo') {
      // Album mode: upload each photo unpublished, then create album post
      const photoIds: string[] = [];
      for (const albumFile of albumFiles) {
        const filePath = path.join(pageDir, 'photos', albumFile);
        if (!fs.existsSync(filePath)) continue;
        const fileBuffer = fs.readFileSync(filePath);
        const formData = new FormData();
        formData.append('access_token', fbToken);
        formData.append('published', 'false');
        formData.append('source', new Blob([fileBuffer]), albumFile);
        const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${fbPageId}/photos`, { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.id) photoIds.push(uploadData.id);
        }
      }

      if (photoIds.length === 0) throw new Error('ไม่สามารถอัปโหลดรูปได้');

      // Create album post with all photos
      const albumBody: Record<string, string> = { message: caption, access_token: fbToken };
      photoIds.forEach((id, idx) => { albumBody[`attached_media[${idx}]`] = JSON.stringify({ media_fbid: id }); });
      const albumRes = await fetch(`https://graph.facebook.com/v21.0/${fbPageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(albumBody).toString()
      });
      if (!albumRes.ok) {
        const err = await albumRes.json();
        throw new Error(`Facebook Album Error: ${err.error?.message || 'Unknown'}`);
      }
      const albumData = await albumRes.json();
      postId = albumData.id;

      // Mark all as posted
      for (const albumFile of albumFiles) {
        markPosted(pageDir, effectivePageId, albumFile);
      }
    } else {
      // Single post mode
      const folder = type === 'video' ? 'videos' : 'photos';
      const filePath = path.join(pageDir, folder, filename);
      if (!fs.existsSync(filePath)) return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
      const fileBuffer = fs.readFileSync(filePath);

      const fbUrl = `https://graph.facebook.com/v21.0/${fbPageId}/${type === 'video' ? 'videos' : 'photos'}`;
      const formData = new FormData();
      formData.append('access_token', fbToken);
      if (type === 'video') formData.append('description', caption);
      else formData.append('caption', caption);
      formData.append('source', new Blob([fileBuffer]), filename);

      const fbRes = await fetch(fbUrl, { method: 'POST', body: formData });
      if (!fbRes.ok) {
        const fbErr = await fbRes.json();
        throw new Error(`Facebook API Error: ${fbErr.error?.message || 'Unknown error'}`);
      }
      const fbData = await fbRes.json();
      postId = fbData.id || fbData.post_id;

      markPosted(pageDir, effectivePageId, filename);
    }

    dbLogActivity('agent-mint', `โพสต์${isAlbum ? 'อัลบั้ม' : 'ไฟล์'} สำเร็จ (ID: ${postId})`);
    return NextResponse.json({ success: true, caption, postId });
  } catch (error: unknown) {
    console.error(error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

function markPosted(pageDir: string, pageId: string, filename: string) {
  const postedFile = path.join(pageDir, 'posted.json');
  try {
    let posted: string[] = [];
    if (fs.existsSync(postedFile)) posted = JSON.parse(fs.readFileSync(postedFile, 'utf8'));
    if (!posted.includes(filename)) { posted.push(filename); fs.writeFileSync(postedFile, JSON.stringify(posted, null, 2)); }
  } catch {}
}

function dbLogActivity(agentId: string, action: string) {
  try {
    const sqlite3 = require('sqlite3');
    const db = new sqlite3.Database(path.resolve(process.cwd(), 'openclaw_dashboard.db'));
    db.run('INSERT INTO logs (agent_id, action) VALUES (?, ?)', [agentId, action]);
    db.close();
  } catch {}
}
