import { NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { getAuthUsernameFromCookies } from '@/lib/auth';

const DATA_DIR = join(process.cwd(), 'data');
const PLANS_DIR = join(DATA_DIR, 'plans');\nconst HIST_DIR = join(DATA_DIR, 'plans_history');

export async function GET() {
  const u = getAuthUsernameFromCookies();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const file = join(PLANS_DIR, `${u}.json`);
  try {
    const json = await readFile(file, 'utf8');
    return new NextResponse(json, { headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch {
    return NextResponse.json({ tasks: [], view: 'week', days: 7, anchorDate: new Date().toISOString() });
  }
}

export async function PUT(req: Request) {
  const u = getAuthUsernameFromCookies();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  // minimal validation
  if (!Array.isArray(body.tasks)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  await mkdir(PLANS_DIR, { recursive: true });
  const file = join(PLANS_DIR, `${u}.json`);
  await writeFile(file, JSON.stringify(body, null, 2), 'utf8');\n  // snapshot to history\n  try {\n    const dir = join(HIST_DIR, u); await mkdir(dir, { recursive: true });\n    const ts = Date.now();\n    await writeFile(join(dir, ${ts}.json), JSON.stringify(body, null, 2), 'utf8');\n  } catch {}\n  return NextResponse.json({ ok: true });
}

