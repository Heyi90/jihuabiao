export type UserRecord = { username: string; password: string; createdAt: string };
export type PlanRecord = { tasks: any[]; view: 'day'|'week'|'month'; days: number; anchorDate: string };

const fs = typeof process === 'object' ? await import('fs/promises').catch(()=>null) : null;
const path = typeof process === 'object' ? await import('path').catch(()=>null) : null;
let kv: any = null;
try { kv = (await import('@vercel/kv')).kv; } catch {}

function hasKV() { return !!kv && !!process.env.KV_REST_API_URL; }

// FS helpers for local dev fallback
async function ensureDir(p: string) { if (!fs) return; try { await fs.mkdir(p, { recursive: true }); } catch {} }
function dataDir() { return path!.join(process.cwd(), 'data'); }

export async function getUser(username: string): Promise<UserRecord | null> {
  if (hasKV()) {
    const s = await kv.get(`user:${username}`);
    return s ? JSON.parse(s) as UserRecord : null;
  }
  const file = path!.join(dataDir(), 'users', `${username}.json`);
  try { const s = await fs!.readFile(file, 'utf8'); return JSON.parse(s) as UserRecord; } catch { return null; }
}

export async function setUser(u: UserRecord): Promise<void> {
  if (hasKV()) {
    await kv.set(`user:${u.username}`, JSON.stringify(u));
    return;
  }
  const dir = path!.join(dataDir(), 'users'); await ensureDir(dir);
  const file = path!.join(dir, `${u.username}.json`);
  await fs!.writeFile(file, JSON.stringify(u, null, 2), 'utf8');
}

export async function hasUser(username: string): Promise<boolean> {
  if (hasKV()) { return (await kv.exists(`user:${username}`)) === 1; }
  const file = path!.join(dataDir(), 'users', `${username}.json`);
  try { await fs!.access(file); return true; } catch { return false; }
}

export async function getPlan(username: string): Promise<PlanRecord | null> {
  if (hasKV()) {
    const s = await kv.get(`plan:${username}`);
    return s ? JSON.parse(s) as PlanRecord : null;
  }
  const file = path!.join(dataDir(), 'plans', `${username}.json`);
  try { const s = await fs!.readFile(file, 'utf8'); return JSON.parse(s) as PlanRecord; } catch { return null; }
}

export async function setPlan(username: string, plan: PlanRecord): Promise<void> {
  const now = Date.now();
  if (hasKV()) {
    await kv.set(`plan:${username}`, JSON.stringify(plan));
    // history index + item
    await kv.zadd(`plan_hist_idx:${username}`, { score: now, member: String(now) });
    await kv.set(`plan_hist:${username}:${now}`, JSON.stringify(plan));
    return;
  }
  const base = dataDir();
  const planDir = path!.join(base, 'plans'); await ensureDir(planDir);
  await fs!.writeFile(path!.join(planDir, `${username}.json`), JSON.stringify(plan, null, 2), 'utf8');
  const histDir = path!.join(base, 'plans_history', username); await ensureDir(histDir);
  await fs!.writeFile(path!.join(histDir, `${now}.json`), JSON.stringify(plan, null, 2), 'utf8');
}

export async function listHistory(username: string, limit=20): Promise<Array<{ts:number}>> {
  if (hasKV()) {
    const ids: string[] = await kv.zrange(`plan_hist_idx:${username}`, 0, limit-1, { rev: true });
    return ids.map(s => ({ ts: Number(s) })).filter(x => !Number.isNaN(x.ts));
  }
  const dir = path!.join(dataDir(), 'plans_history', username);
  try {
    const files = await fs!.readdir(dir);
    return files
      .filter(f=>f.endsWith('.json'))
      .map(f=>Number(f.replace(/\.json$/, '')))
      .filter(n=>!Number.isNaN(n))
      .sort((a,b)=>b-a)
      .slice(0, limit)
      .map(ts=>({ ts }));
  } catch { return []; }
}

export async function getHistory(username: string, ts: number): Promise<PlanRecord | null> {
  if (hasKV()) {
    const s = await kv.get(`plan_hist:${username}:${ts}`);
    return s ? JSON.parse(s) as PlanRecord : null;
  }
  const file = path!.join(dataDir(), 'plans_history', username, `${ts}.json`);
  try { const s = await fs!.readFile(file, 'utf8'); return JSON.parse(s) as PlanRecord; } catch { return null; }
}

