'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password })
    });
    if (res.ok) { alert('注册成功，请登录'); router.push('/login'); } else { const j = await res.json().catch(()=>({})); setError(j.error || '注册失败'); }
  }

  return (
    <div className="mx-auto mt-24 max-w-sm rounded border p-6">
      <h1 className="mb-4 text-lg font-medium">注册</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm">用户名</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="字母/数字/_-/ 3-32 位" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">密码</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="至少 8 位" required />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="w-full rounded border px-3 py-2">注册</button>
      </form>
      <div className="mt-3 text-sm text-zinc-600">已有账号？<a className="underline" href="/login">去登录</a></div>
    </div>
  );
}

