'use client';

import type { Task } from './PlannerGrid';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from './Toast';
import Dialog from './Dialog';

export default function SaveMenu({ tasks, view, days, anchorDate, onLoad }: { tasks: Task[]; view: 'day'|'week'|'month'; days: number; anchorDate: Date; onLoad: (data: any)=>void }) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [showHist, setShowHist] = useState(false);
  const [histItems, setHistItems] = useState<Array<{ ts:number; label:string }>>([]);
  const [histLoading, setHistLoading] = useState(false);
  const toast = useToast();

  async function refreshMe() {
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      if (r.ok) { const j = await r.json(); setUsername(j.username); } else { setUsername(null); }
    } catch { setUsername(null); }
  }

  // 首次挂载检查登录状态
  useEffect(()=>{ refreshMe(); }, []);

  // 登录后自动加载最近一次保存
  useEffect(()=>{
    (async () => {
      if (!username || loadedOnce) return;
      try {
        const res = await fetch('/api/plan', { cache: 'no-store' });
        if (res.ok) { const j = await res.json(); onLoad(j); toast.show('已加载最近一次保存'); }
      } finally { setLoadedOnce(true); }
    })();
  }, [username, loadedOnce, onLoad]);

  const serial = useMemo(() => JSON.stringify({ tasks, view, days, anchorDate: anchorDate.toISOString() }), [tasks, view, days, anchorDate]);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/plan', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: serial });
      if (res.ok) { setLastSavedAt(Date.now()); toast.show('已保存'); } else toast.show('保存失败，请先登录');
    } finally { setLoading(false); }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/plan', { cache: 'no-store' });
      if (res.ok) { const j = await res.json(); onLoad(j); toast.show('已加载最近数据'); } else { toast.show('读取失败，请先登录'); }
    } finally { setLoading(false); }
  }

  async function history() {
    setHistLoading(true);
    try {
      const res = await fetch('/api/plan/history');
      if (!res.ok) { toast.show('请先登录'); return; }
      const j = await res.json();
      setHistItems(j.items || []);
      setShowHist(true);
    } finally { setHistLoading(false); }
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

  const btn = "rounded border px-3 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <div className="flex items-center gap-2">
        {username ? (
          <>
            <span className="text-sm text-zinc-600">{username}</span>
            {savedLabel() && <span className="text-xs text-zinc-500">{savedLabel()}</span>}
            <button disabled={loading} className={btn} onClick={save}>保存</button>
            <button disabled={loading} className={btn} onClick={load}>加载</button>
            <button disabled={loading || histLoading} className={btn} onClick={history}>历史</button>
            <button disabled={loading} className={btn} onClick={logout}>退出</button>
          </>
        ) : (
          <>
            <a className={btn} href="/login">登录</a>
            <a className={btn} href="/register">注册</a>
          </>
        )}
      </div>

      <Dialog open={showHist} title="选择历史版本" onClose={() => setShowHist(false)}>
        {histItems.length===0 ? (
          <div className="text-zinc-500">暂无历史</div>
        ) : (
          <div className="divide-y">
            {histItems.map((it)=> (
              <button key={it.ts} className="flex w-full items-center justify-between px-2 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={async ()=>{ const r=await fetch(`/api/plan/history?ts=${it.ts}`); if(r.ok){ const d=await r.json(); onLoad(d); toast.show('已加载历史版本'); setShowHist(false);} else { toast.show('加载失败'); } }}>
                <span>{it.label}</span><span className="text-xs text-zinc-500">{it.ts}</span>
              </button>
            ))}
          </div>
        )}
      </Dialog>
    </>
  );
}
