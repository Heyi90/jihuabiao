'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password, remember })
    });
    if (res.ok) { router.push('/planner'); router.refresh(); } else { const j = await res.json().catch(()=>({})); setError(j.error || '登录失败'); }
  }

  return (
    <div className="mx-auto mt-24 max-w-sm rounded border p-6">
      <h1 className="mb-4 text-lg font-medium">登录</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm">用户名</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">密码</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded border px-3 py-2" required />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />保持登录（7天）</label>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="w-full rounded border px-3 py-2">登录</button>
      </form>
      <div className="mt-3 text-sm text-zinc-600">没有账号？<a className="underline" href="/register">去注册</a></div>
    </div>
  );
}

