export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { hashPassword, sanitizeUsername } from '@/lib/auth';
import { getUser, hasUser, setUser } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = sanitizeUsername(String((body.username ?? '').toString().trim()));
    const password = String((body.password ?? '').toString());
    if (!username) return NextResponse.json({ error: '用户名无效（3-32 位，字母/数字/下划线/连字符）' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 });

    if (await hasUser(username)) return NextResponse.json({ error: '用户名已存在' }, { status: 409 });

    const record = { username, password: hashPassword(password), createdAt: new Date().toISOString() };
    await setUser(record);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}

