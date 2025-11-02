'use client';

import TimelineY, { hoursRange } from './TimelineY';
import { useMemo } from 'react';

export type Task = {
  id: string;
  title: string;
  dayIndex: number; // 0..days-1
  start: string; // 'HH:mm'
  end: string;   // 'HH:mm'
  done?: boolean;
};

function timeToOffsetFraction(t: string) {
  const [hh, mm] = t.split(':').map(Number);
  const startMinutes = 6 * 60; // 06:00 base
  const total = (hh * 60 + mm) - startMinutes;
  const range = (23 - 6) * 60; // minutes from 06:00 to 23:00
  return Math.max(0, Math.min(1, total / range));
}

function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh*60+em) - (sh*60+sm);
}

type Props = {
  days: number;
  tasks: Task[];
};

export default function PlannerGrid({ days, tasks }: Props) {
  const hours = hoursRange();
  const dayLabels = useMemo(() => {
    const base = new Date();
    base.setHours(0,0,0,0);
    return Array.from({length: days}, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const m = d.getMonth()+1; const day = d.getDate();
      return ${m}/;
    });
  }, [days]);

  return (
    <div className="flex overflow-auto">
      <TimelineY />
      <div className="min-w-0 flex-1">
        {/* Header with day labels */}
        <div className="sticky top-0 z-10 flex bg-background/95 backdrop-blur border-b">
          {dayLabels.map((label, i) => (
            <div key={i} className="flex-1 border-r px-2 py-2 text-center text-sm text-zinc-700">
              {label}
            </div>
          ))}
        </div>
        {/* Grid body: 06:00-23:00, 1h rows with half-hour minor lines */}
        <div className="relative">
          {/* hour rows background */}
          {hours.map((_, row) => (
            <div key={row} className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-zinc-200 dark:border-zinc-800" style={{ top: ${row*48}px}} />
          ))}
          {/* half-hour minor lines */}
          {hours.slice(0,-1).map((_, row) => (
            <div key={'h'+row} className="pointer-events-none absolute left-0 right-0 border-t border-zinc-100 dark:border-zinc-900" style={{ top: ${row*48+24}px}} />
          ))}
          {/* columns */}
          <div className="relative flex" style={{ height: ${(hours.length-1)*48}px}}>
            {dayLabels.map((_, col) => (
              <div key={col} className="relative flex-1 border-r">
                {/* tasks for this column */}
                {tasks.filter(t => t.dayIndex===col).map(t => {
                  const top = timeToOffsetFraction(t.start) * ((hours.length-1)*48);
                  const height = Math.max(24, minutesBetween(t.start, t.end) / 60 * 48);
                  return (
                    <div key={t.id}
                         className={bsolute left-1 right-1 rounded-md border text-xs px-2 py-1 shadow-sm }
                         style={{ top, height }}
                         title={${t.title} (-)}>
                      <div className="truncate">{t.title}</div>
                      <div className="opacity-70">{t.start} - {t.end}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
