export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getAuthUsernameFromCookies } from '@/lib/auth';

const DATA_DIR = join(process.cwd(), 'data');
const HIST_DIR = join(DATA_DIR, 'plans_history');

function fmt(ts: number) {
  const d = new Date(ts);
  const p = (n:number)=> String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export async function GET(req: Request) {
  const u = getAuthUsernameFromCookies();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const ts = url.searchParams.get('ts');
  const dir = join(HIST_DIR, u);
  if (ts) {
    try {
      const json = await readFile(join(dir, `${ts}.json`), 'utf8');
      return new NextResponse(json, { headers: { 'content-type': 'application/json; charset=utf-8' } });
    } catch { return NextResponse.json({ error: 'Not Found' }, { status: 404 }); }
  }
  try {
    const files = await readdir(dir);
    const items = files
      .filter(f => f.endsWith('.json'))
      .map(f => Number(f.replace(/\.json$/, '')))
      .filter(n => !Number.isNaN(n))
      .sort((a,b)=> b-a)
      .slice(0, 20)
      .map(n => ({ ts: n, label: fmt(n) }));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

