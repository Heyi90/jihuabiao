'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-600">主题</span>
      <button className={`rounded border px-2 py-1 ${theme==='light' ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`} onClick={() => setTheme('light')}>亮</button>
      <button className={`rounded border px-2 py-1 ${theme==='dark' ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`} onClick={() => setTheme('dark')}>暗</button>
      <button className={`rounded border px-2 py-1 ${theme==='system' ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`} onClick={() => setTheme('system')}>系统</button>
    </div>
  );
}
