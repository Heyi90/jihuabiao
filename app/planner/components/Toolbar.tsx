'use client';

import type React from 'react';
import ThemeToggle from './ThemeToggle';

type ViewMode = 'day' | 'week' | 'month';

type Props = {
  view: ViewMode;
  onChangeView: (v: ViewMode) => void;
  days: number; // 3 | 7 | 15 | custom length
  onChangeDays: (n: number) => void;
  // 新增：导航与范围展示
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  rangeLabel: string;
};

export default function Toolbar({ view, onChangeView, days, onChangeDays, onPrev, onNext, onToday, rangeLabel, extraRight }: Props & { extraRight?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button className="rounded border px-2 py-1 text-sm" onClick={onPrev}>◀</button>
          <button className="rounded border px-2 py-1 text-sm" onClick={onToday}>今天</button>
          <button className="rounded border px-2 py-1 text-sm" onClick={onNext}>▶</button>
        </div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300">{rangeLabel}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">视图</span>
          {(['day','week','month'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => onChangeView(v)}
              className={`rounded px-3 py-1 text-sm border ${view===v ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
              {v==='day'?'日':v==='week'?'周':'月'}
            </button>
          ))}
        </div>
        {view !== 'month' && (
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
        )}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {extraRight}
        </div>
      </div>
    </div>
  );
}
