export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getAuthUsernameFromCookies } from '@/lib/auth';
import { getPlan, setPlan, type PlanRecord } from '@/lib/storage';

export async function GET() {
  const u = await getAuthUsernameFromCookies();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const plan = await getPlan(u);
  if (plan) return NextResponse.json(plan);
  return NextResponse.json({ tasks: [], view: 'week', days: 7, anchorDate: new Date().toISOString() });
}

export async function PUT(req: Request) {
  const u = await getAuthUsernameFromCookies();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json() as PlanRecord;
  if (!Array.isArray(body.tasks)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  await setPlan(u, body);
  return NextResponse.json({ ok: true });
}
