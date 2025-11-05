import { NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { hashPassword, sanitizeUsername } from '@/lib/auth';

const DATA_DIR = join(process.cwd(), 'data');
const USERS_DIR = join(DATA_DIR, 'users');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = sanitizeUsername(String(body.username || ''));
    const password = String(body.password || '');
    if (!username) return NextResponse.json({ error: '用户名无效（3-32 位，字母/数字/下划线/连字符）' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 });

    await mkdir(USERS_DIR, { recursive: true });
    const userPath = join(USERS_DIR, `${username}.json`);
    try { await readFile(userPath); return NextResponse.json({ error: '用户名已存在' }, { status: 409 }); } catch {}

    const record = {
      username,
      password: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    await writeFile(userPath, JSON.stringify(record, null, 2), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
