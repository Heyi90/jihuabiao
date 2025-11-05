export type UserRecord = { username: string; password: string; createdAt: string };
export type PlanRecord = { tasks: any[]; view: 'day'|'week'|'month'; days: number; anchorDate: string };

// Try dynamic imports so local dev (node) 有 fs/path，Vercel 仍可工作
const fs = (typeof process === 'object') ? await import('fs/promises').catch(()=>null as any) : null as any;
const path = (typeof process === 'object') ? await import('path').catch(()=>null as any) : null as any;

let kv: any = null;
try { kv = (await import('@vercel/kv')).kv; } catch {}

function hasKV() { return !!kv && !!process.env.KV_REST_API_URL; }

// helpers
async function ensureDir(p: string) { if (!fs) return; try { await fs.mkdir(p, { recursive: true }); } catch {} }
function dataDir() { return path!.join(process.cwd(), 'data'); }

function asObj<T>(s: any): T | null {
  if (s == null) return null;
  if (typeof s === 'string') { try { return JSON.parse(s) as T; } catch { return null; } }
  if (typeof s === 'object') return s as T;
  return null;
}

export async function getUser(username: string): Promise<UserRecord | null> {
  if (hasKV()) {
    const s = await kv.get(`user:${username}`);
    return asObj<UserRecord>(s);
  }
  const file = path!.join(dataDir(), 'users', `${username}.json`);
  try { const s = await fs!.readFile(file, 'utf8'); return JSON.parse(s) as UserRecord; } catch { return null; }
}

export async function setUser(u: UserRecord): Promise<void> {
  if (hasKV()) { await kv.set(`user:${u.username}`, JSON.stringify(u)); return; }
  const dir = path!.join(dataDir(), 'users'); await ensureDir(dir);
  const file = path!.join(dir, `${u.username}.json`);
  await fs!.writeFile(file, JSON.stringify(u, null, 2), 'utf8');
}

export async function hasUser(username: string): Promise<boolean> {
  if (hasKV()) { try { return (await kv.exists(`user:${username}`)) === 1; } catch { return false; } }
  const file = path!.join(dataDir(), 'users', `${username}.json`);
  try { await fs!.access(file); return true; } catch { return false; }
}

export async function getPlan(username: string): Promise<PlanRecord | null> {
  if (hasKV()) {
    const s = await kv.get(`plan:${username}`);
    return asObj<PlanRecord>(s);
  }
  const file = path!.join(dataDir(), 'plans', `${username}.json`);
  try { const s = await fs!.readFile(file, 'utf8'); return JSON.parse(s) as PlanRecord; } catch { return null; }
}

export async function setPlan(username: string, plan: PlanRecord): Promise<void> {
  const now = Date.now();
  if (hasKV()) {
    await kv.set(`plan:${username}`, JSON.stringify(plan));
    // history index + item
    try { await kv.zadd(`plan_hist_idx:${username}`, { score: now, member: String(now) }); } catch {}
    try { await kv.set(`plan_hist:${username}:${now}`, JSON.stringify(plan)); } catch {}
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
    const ids = await (kv.zrange(`plan_hist_idx:${username}`, 0, limit-1, { rev: true }) as Promise<any>);
    const arr: string[] = Array.isArray(ids) ? ids : [];
    return arr.map(s => ({ ts: Number(s) })).filter(x => !Number.isNaN(x.ts));
  }
  const dir = path!.join(dataDir(), 'plans_history', username);
  try {
    const filesAny = await fs!.readdir(dir) as any;
    const filesArr: string[] = Array.isArray(filesAny) ? filesAny as string[] : [];
    return filesArr
      .filter((f: string)=>f.endsWith('.json'))
      .map((f: string)=>Number(f.replace(/\.json$/, '')))
      .filter((n: number)=>!Number.isNaN(n))
      .sort((a: number,b: number)=>b-a)
      .slice(0, limit)
      .map((ts: number)=>({ ts }));
  } catch { return []; }
}

export async function getHistory(username: string, ts: number): Promise<PlanRecord | null> {
  if (hasKV()) {
    const s = await kv.get(`plan_hist:${username}:${ts}`);
    return asObj<PlanRecord>(s);
  }
  const file = path!.join(dataDir(), 'plans_history', username, `${ts}.json`);
  try { const s = await fs!.readFile(file, 'utf8'); return JSON.parse(s) as PlanRecord; } catch { return null; }
}
