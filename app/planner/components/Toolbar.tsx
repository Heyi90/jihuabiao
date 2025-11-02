'use client';

import ThemeToggle from './ThemeToggle';

type ViewMode = 'day' | 'week' | 'month';

type Props = {
  view: ViewMode;
  onChangeView: (v: ViewMode) => void;
  days: number; // 3 | 7 | 15 | custom length
  onChangeDays: (n: number) => void;
};

export default function Toolbar({ view, onChangeView, days, onChangeDays }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-600">视图</span>
        {(['day','week','month'] as ViewMode[]).map(v => (
          <button key={v} onClick={() => onChangeView(v)}
            className={`rounded px-3 py-1 text-sm border ${view===v ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
            {v==='day'?'日':v==='week'?'周':'月'}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-600">周期</span>
        {[3,7,15].map(n => (
          <button key={n} onClick={() => onChangeDays(n)}
            className={`rounded px-3 py-1 text-sm border ${days===n ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>{n}天</button>
        ))}
        <button className="rounded px-3 py-1 text-sm border" onClick={() => {
          const v = prompt('自定义天数 (1-30)');
          const n = v ? Math.max(1, Math.min(30, parseInt(v))) : NaN;
          if (!Number.isNaN(n)) onChangeDays(n);
        }}>自定义</button>
      </div>
      <ThemeToggle />
    </div>
  );
}
