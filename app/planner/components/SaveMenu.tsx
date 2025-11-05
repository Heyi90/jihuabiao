'use client';

import type { Task } from './PlannerGrid';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function SaveMenu({ tasks, view, days, anchorDate, onLoad }: { tasks: Task[]; view: 'day'|'week'|'month'; days: number; anchorDate: Date; onLoad: (data: any)=>void }) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  async function refreshMe() {
    try { const r = await fetch('/api/auth/me', { cache: 'no-store' }); if (r.ok) { const j = await r.json(); setUsername(j.username); } else { setUsername(null); } } catch { setUsername(null); }
  }

  useEffect(()=>{ setAuto(localStorage.getItem('autoSave') !== 'false'); refreshMe(); }, []);
  useEffect(()=>{ localStorage.setItem('autoSave', String(auto)); }, [auto]);

  const serial = useMemo(()=> JSON.stringify({ tasks, view, days, anchorDate: anchorDate.toISOString() }), [tasks, view, days, anchorDate]);

  // debounce auto-save
  useEffect(()=> {
    if (!username || !auto) return; // only when logged in and auto enabled
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/plan', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: serial });
        if (res.ok) setLastSavedAt(Date.now());
      } catch {}
    }, 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [serial, username, auto]);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: serial
      });
      if (res.ok) { setLastSavedAt(Date.now()); alert('已保存'); } else alert('保存失败，请先登录');
    } finally { setLoading(false); }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/plan');
      if (res.ok) { const j = await res.json(); onLoad(j); } else { alert('读取失败，请先登录'); }
    } finally { setLoading(false); }
  }

  async function history() {
    const res = await fetch('/api/plan/history');
    if (!res.ok) { alert('请先登录'); return; }
    const j = await res.json();
    if (!j.items || j.items.length === 0) { alert('暂无历史'); return; }
    const list = j.items.map((x: any, i: number) => `${i+1}. ${x.label}`).join('\n');
    const v = prompt(`选择历史版本编号:\n${list}`);
    const n = v ? parseInt(v, 10) : NaN;
    if (!n || n<1 || n>j.items.length) return;
    const pick = j.items[n-1];
    const r2 = await fetch(`/api/plan/history?ts=${pick.ts}`);
    if (r2.ok) { const d = await r2.json(); onLoad(d); } else { alert('加载失败'); }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUsername(null);
  }

  function savedLabel() {
    if (!lastSavedAt) return null;
    const s = Math.round((Date.now() - lastSavedAt)/1000);
    return s <= 5 ? '刚刚已保存' : `已保存 ${s}s 前`;
  }

  return (
    <div className="flex items-center gap-2">
      {username ? (
        <>
          <span className="text-sm text-zinc-600">{username}</span>
          <label className="flex items-center gap-1 text-sm text-zinc-600"><input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)} />自动保存</label>
          {savedLabel() && <span className="text-xs text-zinc-500">{savedLabel()}</span>}
          <button disabled={loading} className="rounded border px-3 py-1 text-sm" onClick={save}>保存</button>
          <button disabled={loading} className="rounded border px-3 py-1 text-sm" onClick={load}>加载</button>
          <button disabled={loading} className="rounded border px-3 py-1 text-sm" onClick={history}>历史</button>
          <button disabled={loading} className="rounded border px-3 py-1 text-sm" onClick={logout}>退出</button>
        </>
      ) : (
        <>
          <a className="rounded border px-3 py-1 text-sm" href="/login">登录</a>
          <a className="rounded border px-3 py-1 text-sm" href="/register">注册</a>
        </>
      )}
    </div>
  );
}
