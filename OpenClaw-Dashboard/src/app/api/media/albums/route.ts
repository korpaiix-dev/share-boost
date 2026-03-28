import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

type Album = { id: string; name: string; files: string[]; createdAt: string; };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get('pageId') || 'main';

    const albumsPath = path.join(os.homedir(), 'PageContent', 'pages', pageId, 'albums.json');
    
    let albums = [];
    if (fs.existsSync(albumsPath)) {
      albums = JSON.parse(fs.readFileSync(albumsPath, 'utf8'));
    }

    return NextResponse.json({ success: true, albums });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, pageId, albumName, files } = await req.json();
    const effectivePageId = pageId || 'main';
    const albumsPath = path.join(os.homedir(), 'PageContent', 'pages', effectivePageId, 'albums.json');

    let albums: Album[] = [];
    if (fs.existsSync(albumsPath)) {
      try {
        albums = JSON.parse(fs.readFileSync(albumsPath, 'utf8'));
      } catch {
        albums = [];
      }
    }

    if (action === 'create') {
      if (!files || files.length === 0) {
        return NextResponse.json({ success: false, error: 'No files provided for album' }, { status: 400 });
      }

      const newAlbum = {
        id: `album_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: albumName || `Album ${new Date().toLocaleDateString('th-TH')}`,
        files: files,
        createdAt: new Date().toISOString()
      };

      albums.unshift(newAlbum); // Add to the beginning

      fs.writeFileSync(albumsPath, JSON.stringify(albums, null, 2));
      return NextResponse.json({ success: true, message: 'สร้างอัลบั้มสำเร็จ', album: newAlbum });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { pageId, albumId } = await req.json();
    const effectivePageId = pageId || 'main';
    const albumsPath = path.join(os.homedir(), 'PageContent', 'pages', effectivePageId, 'albums.json');

    if (fs.existsSync(albumsPath)) {
      let albums: Album[] = JSON.parse(fs.readFileSync(albumsPath, 'utf8'));
      albums = albums.filter(a => a.id !== albumId);
      fs.writeFileSync(albumsPath, JSON.stringify(albums, null, 2));
      return NextResponse.json({ success: true, message: 'ลบอัลบั้มสำเร็จ' });
    }

    return NextResponse.json({ success: false, error: 'Albums file not found' }, { status: 404 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
