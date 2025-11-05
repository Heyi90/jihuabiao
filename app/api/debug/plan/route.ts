export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getAuthUsernameFromCookies } from '@/lib/auth';
import { getPlan, listHistory } from '@/lib/storage';

export async function GET(req: Request) {
  const u = await getAuthUsernameFromCookies();
  const url = new URL(req.url);
  const who = url.searchParams.get('u') || u || '';
  const take = Number(url.searchParams.get('n') || '10');
  const env = {
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    KV_REST_API_READ_ONLY_TOKEN: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
  } as const;
  try {
    if (!who) return NextResponse.json({ env, note: 'add ?u=<username>' }, { status: 400 });
    const plan = await getPlan(who);
    const hist = await listHistory(who, isNaN(take)?10:take);
    return NextResponse.json({ env, user: who, hasPlan: !!plan, plan, history: hist });
  } catch (e: any) {
    return NextResponse.json({ env, error: String(e&&e.message||e) }, { status: 500 });
  }
}
