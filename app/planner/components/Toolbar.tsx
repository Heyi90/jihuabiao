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
  selectedTaskId?: string | null;
  onChangeTaskColor?: (c: 'blue'|'green'|'amber'|'purple'|'indigo'|'rose'|'gray') => void;
};

export default function Toolbar({ view, onChangeView, days, onChangeDays, onPrev, onNext, onToday, rangeLabel, extraRight, selectedTaskId, onChangeTaskColor }: Props & { extraRight?: React.ReactNode }) {
  const isTimeline = view !== 'month';
  const COLORS: Array<'blue'|'green'|'amber'|'purple'|'indigo'|'rose'|'gray'> = ['blue','green','amber','purple','indigo','rose','gray'];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      {/* 左侧：导航、范围、颜色调板 */}
      <div className="flex flex-1 items-center gap-4">
        <div className="flex items-center gap-2">
          <button className="rounded border px-2 py-1 text-sm" onClick={onPrev}>◀</button>
          <button className="rounded border px-2 py-1 text-sm" onClick={onToday}>今天</button>
          <button className="rounded border px-2 py-1 text-sm" onClick={onNext}>▶</button>
        </div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300">{rangeLabel}</div>
        {/* 颜色（应用到当前选中任务） */}
        <div className="ml-2 flex items-center gap-2">
          <span className="text-sm text-zinc-600">颜色</span>
          {COLORS.map(c => (
            <button key={c} title={`设为${c}`} disabled={!selectedTaskId} onClick={() => onChangeTaskColor && selectedTaskId && onChangeTaskColor(c)} className={`h-5 w-5 rounded ${!selectedTaskId? 'opacity-30 cursor-not-allowed' : ''} ${c==='blue'?'bg-blue-500':''} ${c==='green'?'bg-green-500':''} ${c==='amber'?'bg-amber-500':''} ${c==='purple'?'bg-purple-500':''} ${c==='indigo'?'bg-indigo-500':''} ${c==='rose'?'bg-rose-500':''} ${c==='gray'?'bg-zinc-500':''}`}></button>
          ))}
        </div>
      </div>

      {/* 右侧：视图与窗口、主题、导出 */}
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
