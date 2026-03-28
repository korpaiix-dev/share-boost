import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get('pageId') || 'main';

    const baseDir = path.join(os.homedir(), 'PageContent');
    const pageDir = path.join(baseDir, 'pages', pageId);
    const photosDir = path.join(pageDir, 'photos');
    const videosDir = path.join(pageDir, 'videos');
    const postedFile = path.join(pageDir, 'posted.json');

    // Ensure dirs exist
    if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
    if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

    let posted: string[] = [];
    if (fs.existsSync(postedFile)) {
      posted = JSON.parse(fs.readFileSync(postedFile, 'utf8'));
    }

    const readDirSafe = (d: string) => fs.existsSync(d) ? fs.readdirSync(d) : [];

    const photos = readDirSafe(photosDir).filter(f => !f.startsWith('.')).map(file => ({
      name: file,
      type: 'photo' as const,
      path: `pages/${pageId}/photos/${file}`,
      posted: posted.includes(file)
    }));

    const videos = readDirSafe(videosDir).filter(f => !f.startsWith('.')).map(file => ({
      name: file,
      type: 'video' as const,
      path: `pages/${pageId}/videos/${file}`,
      posted: posted.includes(file)
    }));

    const allMedia = [...photos, ...videos].sort((a, b) => a.posted === b.posted ? 0 : a.posted ? 1 : -1);

    return NextResponse.json({ success: true, media: allMedia, pageId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
