'use client';

import type React from 'react';
import ThemeToggle from './ThemeToggle';

type ViewMode = 'day' | 'week' | 'month';

type Props = {
  view: ViewMode;
  onChangeView: (v: ViewMode) => void;
  days: number; // timeline window length in days
  onChangeDays: (n: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  rangeLabel: string;
};

// 合并“日/周”到一个“时间轴 + 窗口天数”控制：
// - 视图仅保留：时间轴（非月） 与 月
// - 时间轴下提供窗口：1天/3天/7天/15天/自定义（1天≈原“日”，7天≈原“周”）
export default function Toolbar({ view, onChangeView, days, onChangeDays, onPrev, onNext, onToday, rangeLabel, extraRight }: Props & { extraRight?: React.ReactNode }) {
  const isTimeline = view !== 'month';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      {/* 导航与范围 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button className="rounded border px-2 py-1 text-sm" onClick={onPrev}>◀</button>
          <button className="rounded border px-2 py-1 text-sm" onClick={onToday}>今天</button>
          <button className="rounded border px-2 py-1 text-sm" onClick={onNext}>▶</button>
        </div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300">{rangeLabel}</div>
      </div>

      {/* 视图与窗口 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">视图</span>
          <button onClick={() => onChangeView('week')} className={`rounded px-3 py-1 text-sm border ${isTimeline ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>时间轴</button>
          <button onClick={() => onChangeView('month')} className={`rounded px-3 py-1 text-sm border ${view==='month' ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>月</button>
        </div>
        {isTimeline && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">窗口</span>
            {[1,3,7,15].map(n => (
              <button key={n} onClick={() => onChangeDays(n)} className={`rounded px-3 py-1 text-sm border ${days===n ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>{n}天</button>
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
