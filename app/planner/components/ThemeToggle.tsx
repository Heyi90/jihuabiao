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
      <button className={ounded border px-2 py-1 } onClick={() => setTheme('light')}>亮</button>
      <button className={ounded border px-2 py-1 } onClick={() => setTheme('dark')}>暗</button>
      <button className={ounded border px-2 py-1 } onClick={() => setTheme('system')}>系统</button>
    </div>
  );
}
