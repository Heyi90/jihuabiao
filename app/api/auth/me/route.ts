export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getAuthUsernameFromCookies } from '@/lib/auth';

export async function GET() {
  const u = await getAuthUsernameFromCookies();
  if (!u) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, username: u });
}


