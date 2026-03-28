import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: Request) {
  try {
    const { filePath, pageId } = await req.json();

    if (!filePath) {
      return NextResponse.json({ success: false, error: 'Missing filePath' }, { status: 400 });
    }

    if (filePath.includes('..')) {
      return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
    }

    const baseDir = path.join(os.homedir(), 'PageContent');
    const fullPath = path.join(baseDir, filePath);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ success: false, error: 'ไม่พบไฟล์' }, { status: 404 });
    }

    const stat = fs.statSync(fullPath);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
    const fileName = path.basename(fullPath);

    // Delete permanently
    fs.unlinkSync(fullPath);

    // Remove from per-page posted.json
    const effectivePageId = pageId || 'main';
    const postedPath = path.join(baseDir, 'pages', effectivePageId, 'posted.json');

    if (fs.existsSync(postedPath)) {
      try {
        const posted: string[] = JSON.parse(fs.readFileSync(postedPath, 'utf8'));
        const updated = posted.filter(f => f !== fileName);
        if (updated.length !== posted.length) {
          fs.writeFileSync(postedPath, JSON.stringify(updated, null, 2));
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      deleted: fileName,
      freedMB: sizeMB,
      message: `ลบ ${fileName} สำเร็จ (คืนพื้นที่ ${sizeMB} MB)`
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
