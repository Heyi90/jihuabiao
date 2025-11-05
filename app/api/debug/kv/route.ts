export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getUser, hasUser } from '@/lib/storage';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const u = url.searchParams.get('u') || '';
  const env = {
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    KV_REST_API_READ_ONLY_TOKEN: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
  } as const;

  try {
    if (!u) return NextResponse.json({ env, note: 'add ?u=<username> to query a user' });
    const exists = await hasUser(u);
    const user = await getUser(u);
    return NextResponse.json({ env, exists, user: user ? { username: user.username, hasPass: !!user.password, createdAt: user.createdAt } : null });
  } catch (e: any) {
    return NextResponse.json({ env, error: String(e && e.message || e) }, { status: 500 });
  }
}
