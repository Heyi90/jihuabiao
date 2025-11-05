export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getAuthUsernameFromCookies } from '@/lib/auth';
import { getHistory, listHistory } from '@/lib/storage';

function fmt(ts: number) {
  const d = new Date(ts);
  const p = (n:number)=> String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export async function GET(req: Request) {
  const u = await getAuthUsernameFromCookies();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const ts = url.searchParams.get('ts');
  if (ts) {
    const rec = await getHistory(u, Number(ts));
    if (!rec) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(rec);
  }
  const items = (await listHistory(u, 20)).map(x => ({ ts: x.ts, label: fmt(x.ts) }));
  return NextResponse.json({ items });
}
