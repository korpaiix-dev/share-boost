import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filepath = searchParams.get('path');

    if (!filepath) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    if (filepath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const fullPath = path.join(os.homedir(), 'PageContent', filepath);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;

    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.mov') contentType = 'video/quicktime';
    else if (ext === '.webm') contentType = 'video/webm';

    // Handle Range requests for video
    const rangeHeader = req.headers.get('range');
    if (rangeHeader && contentType.startsWith('video/')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1);
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(fullPath, { start, end });
      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', chunkSize.toString());
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Cache-Control', 'public, max-age=86400');

      return new NextResponse(buffer, { status: 206, headers });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileSize.toString());
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=86400');

    return new NextResponse(fileBuffer, { headers });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
