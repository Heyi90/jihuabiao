'use client';

import type React from 'react';
import type { Task } from './PlannerGrid';

const WEEK_LABELS = ['一','二','三','四','五','六','日'];

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function sameDate(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

function chipClass(t: Task) {
  const c = t.color || 'blue';
  const base = c==='blue'? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
    : c==='green'? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
    : c==='amber'? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
    : c==='purple'? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
    : c==='indigo'? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200'
    : c==='rose'? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200';
  return t.done ? `${base} line-through opacity-70` : base;
}

export default function MonthView({ tasks, anchorDate }: { tasks: Task[]; anchorDate: Date }) {
  const today = startOfDay(anchorDate);
  const monthStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
  const dow = (monthStart.getDay()+6)%7; // 周一=0
  const viewStart = addDays(monthStart, -dow);
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => addDays(viewStart, i));

  const tasksWithDate = tasks.map(t => ({ task: t, date: addDays(today, t.dayIndex) }));

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b text-center text-xs text-zinc-600 dark:text-zinc-400">
        {WEEK_LABELS.map((w, i) => (
          <div key={i} className="border-r px-2 py-2 last:border-r-0">周{w}</div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {cells.map((d, idx) => {
          const inMonth = d.getMonth() === today.getMonth();
          const items = tasksWithDate.filter(x => sameDate(x.date, d)).map(x => x.task);
          const shown = items.slice(0,3);
          const more = items.length - shown.length;
          return (
            <div key={idx} className={`border-r border-b p-2 text-xs ${inMonth? 'bg-background' : 'bg-zinc-50 dark:bg-zinc-900/40 text-zinc-400'}`}>
              <div className="mb-1 flex items-center justify-between">
                <span className={`text-[11px] ${sameDate(d,today)? 'rounded bg-blue-500 px-1 text-white' : ''}`}>{d.getDate()}</span>
                {sameDate(d,today) && <span className="text-[10px] text-blue-500">今天</span>}
              </div>
              <div className="space-y-1">
                {shown.map(t => (
                  <div key={t.id} className={`truncate rounded px-1 py-0.5 ${chipClass(t)}`}>{t.title}</div>
                ))}
                {more>0 && <div className="truncate text-[10px] text-zinc-500">+{more} 个任务</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
