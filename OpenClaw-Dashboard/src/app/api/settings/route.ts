import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET() {
  try {
    const envContent = fs.readFileSync(path.join(os.homedir(), '.openclaw', '.env'), 'utf8');
    let fbPageId = '', fbToken = '';
    const lines = envContent.split(String.fromCharCode(10));
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('FACEBOOK_PAGE_ID=')) {
        fbPageId = trimmed.substring('FACEBOOK_PAGE_ID='.length).trim();
      }
      if (trimmed.startsWith('FACEBOOK_ACCESS_TOKEN=')) {
        fbToken = trimmed.substring('FACEBOOK_ACCESS_TOKEN='.length).trim();
      }
    });

    const authPath = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'agent', 'auth-profiles.json');
    let openRouterKey = '';
    if (fs.existsSync(authPath)) {
      const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      openRouterKey = authData.profiles['openrouter:default']?.key || '';
    }

    let orData = null;
    if (openRouterKey) {
      const orRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${openRouterKey}` }
      });
      if (orRes.ok) {
        const responseData = await orRes.json();
        orData = responseData.data;
      }
    }

    return NextResponse.json({ 
      success: true, 
      openRouter: orData,
      facebook: { pageId: fbPageId, tokenSet: !!fbToken }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
