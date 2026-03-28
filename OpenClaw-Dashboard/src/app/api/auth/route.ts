import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'openclaw2026';
const SESSION_TOKEN = 'openclaw_session';

const validTokens: Set<string> = new Set();

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const token = Buffer.from(`${username}:${Date.now()}:${Math.random()}`).toString('base64');
      validTokens.add(token);

      const cookieStore = await cookies();
      cookieStore.set(SESSION_TOKEN, token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });

      return NextResponse.json({ success: true, message: 'เข้าสู่ระบบสำเร็จ' });
    }

    return NextResponse.json({ success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_TOKEN);

  if (token && (validTokens.has(token.value) || validTokens.size === 0)) {
    // Accept any valid cookie on server restart (stateless fallback)
    if (validTokens.size === 0 && token.value) validTokens.add(token.value);
    return NextResponse.json({ success: true, authenticated: true });
  }

  return NextResponse.json({ success: true, authenticated: false }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_TOKEN);
  if (token) validTokens.delete(token.value);
  cookieStore.delete(SESSION_TOKEN);
  return NextResponse.json({ success: true, message: 'ออกจากระบบแล้ว' });
}
