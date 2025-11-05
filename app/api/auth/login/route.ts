export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { sanitizeUsername, verifyPassword, setAuthCookie } from '@/lib/auth';
import { getUser } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = sanitizeUsername(String((body.username ?? '').toString().trim()));
    const password = String((body.password ?? '').toString());
    const remember = Boolean(body.remember);
    if (!username || !password) return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });

    const data = await getUser(username);
    if (!data || !verifyPassword(password, data.password)) return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });

    const res = NextResponse.json({ ok: true, username });
    await setAuthCookie(username, remember ? 7 : null);
    return res;
  } catch {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  }
}

