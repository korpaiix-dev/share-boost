import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const PAGES_DIR = path.join(os.homedir(), 'PageContent', 'pages');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const pageId = formData.get('pageId') as string || 'main';
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
    }

    // Ensure page directories exist
    const photosDir = path.join(PAGES_DIR, pageId, 'photos');
    const videosDir = path.join(PAGES_DIR, pageId, 'videos');
    fs.mkdirSync(photosDir, { recursive: true });
    fs.mkdirSync(videosDir, { recursive: true });

    const uploaded: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name).toLowerCase();
      const isVideo = ['.mp4', '.mov', '.webm'].includes(ext);
      const targetDir = isVideo ? videosDir : photosDir;
      const targetPath = path.join(targetDir, file.name);

      fs.writeFileSync(targetPath, buffer);
      uploaded.push(file.name);
    }

    return NextResponse.json({
      success: true,
      uploaded,
      message: `อัปโหลด ${uploaded.length} ไฟล์สำเร็จ`
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
