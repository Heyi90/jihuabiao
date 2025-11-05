export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { sanitizeUsername, verifyPassword, setAuthCookie } from '@/lib/auth';

const DATA_DIR = join(process.cwd(), 'data');
const USERS_DIR = join(DATA_DIR, 'users');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = sanitizeUsername(String(body.username || ''));
    const password = String(body.password || '');
    const remember = Boolean(body.remember);
    if (!username || !password) return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });

    const userPath = join(USERS_DIR, `${username}.json`);
    let data: any;
    try { data = JSON.parse(await readFile(userPath, 'utf8')); } catch { return NextResponse.json({ error: '账号或密码错误' }, { status: 401 }); }
    if (!verifyPassword(password, data.password)) return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });

    const res = NextResponse.json({ ok: true, username });
    await setAuthCookie(username, remember ? 7 : null);
    return res;
  } catch {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  }
}


