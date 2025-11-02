'use client';

import TimelineY, { hoursRange } from './TimelineY';
import { useCallback, useMemo, useRef, useState } from 'react';

export type Task = {
  id: string;
  title: string;
  dayIndex: number; // 0..days-1
  start: string; // 'HH:mm'
  end: string;   // 'HH:mm'
  done?: boolean;
};

type Props = {
  days: number;
  tasks: Task[];
  onChangeTasks?: (tasks: Task[]) => void;
};

const HOUR_PX = 48; // 每小时高度
const START_HOUR = 6;
const END_HOUR = 23; // 含尾端显示，但高度计算以 (END-START) 小时
const RANGE_MINUTES = (END_HOUR - START_HOUR) * 60;

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(':').map(Number); return hh*60+mm;
}
function minutesToTime(m: number) {
  const hh = Math.floor(m/60), mm = m%60; return ${String(hh).padStart(2,'0')}:;
}
function snap30(mins: number) { return Math.round(mins/30)*30; }

function timeToOffsetPx(t: string) {
  const mins = timeToMinutes(t) - START_HOUR*60; // 相对 06:00
  const frac = clamp(mins / RANGE_MINUTES, 0, 1);
  return frac * ((END_HOUR - START_HOUR) * HOUR_PX);
}
function minutesBetween(start: string, end: string) { return timeToMinutes(end) - timeToMinutes(start); }

export default function PlannerGrid({ days, tasks, onChangeTasks }: Props) {
  const hours = hoursRange(START_HOUR, END_HOUR);
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<null | {
    id: string;
    type: 'move' | 'resize-top' | 'resize-bottom';
    startClientX: number;
    startClientY: number;
    orig: Task;
    duration: number; // minutes
  }>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  const heightPx = (hours.length - 1) * HOUR_PX;

  const dayLabels = useMemo(() => {
    const base = new Date(); base.setHours(0,0,0,0);
    return Array.from({length: days}, (_, i) => {
      const d = new Date(base); d.setDate(base.getDate() + i);
      return ${d.getMonth()+1}/;
    });
  }, [days]);

  const updateTask = useCallback((id: string, updater: (t: Task) => Task) => {
    if (!onChangeTasks) return;
    onChangeTasks(tasks.map(t => t.id===id ? updater(t) : t));
  }, [tasks, onChangeTasks]);

  const handleCreateAt = useCallback((col: number, clientY: number) => {
    if (!onChangeTasks || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const relY = clamp(clientY - rect.top, 0, heightPx);
    const minutesFromStart = snap30(Math.round(relY / heightPx * RANGE_MINUTES));
    let startMin = START_HOUR*60 + minutesFromStart;
    let endMin = startMin + 60; // 默认 60 分钟
    if (endMin > END_HOUR*60) { endMin = END_HOUR*60; startMin = Math.max(START_HOUR*60, endMin - 60); }
    const newTask: Task = {
      id: 't' + Math.random().toString(36).slice(2,8),
      title: '新任务',
      dayIndex: clamp(col, 0, days-1),
      start: minutesToTime(startMin),
      end: minutesToTime(endMin),
    };
    onChangeTasks([...tasks, newTask]);
    setSelectedId(newTask.id);
  }, [days, heightPx, onChangeTasks, tasks]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const colWidth = rect.width / days;
    const relX = clamp(e.clientX - rect.left, 0, rect.width - 1);
    const relY = clamp(e.clientY - rect.top, 0, heightPx);
    const dayIndex = clamp(Math.floor(relX / colWidth), 0, days-1);

    // y -> minutes from 06:00, snap to 30m
    const minutesFromStart = snap30(Math.round(relY / heightPx * RANGE_MINUTES));
    const currentStart = START_HOUR*60 + minutesFromStart;

    if (drag.type === 'move') {
      const newStart = clamp(currentStart, START_HOUR*60, END_HOUR*60);
      let newEnd = newStart + drag.duration;
      if (newEnd > END_HOUR*60) { newEnd = END_HOUR*60; }
      const fixedStart = newEnd - drag.duration; // 保持时长
      updateTask(drag.id, t => ({ ...t, dayIndex, start: minutesToTime(fixedStart), end: minutesToTime(newEnd) }));
    } else if (drag.type === 'resize-top') {
      // 只改开始，不超过 end-30
      const endMin = timeToMinutes(drag.orig.end);
      const newStart = clamp(currentStart, START_HOUR*60, endMin - 30);
      updateTask(drag.id, t => ({ ...t, dayIndex, start: minutesToTime(newStart) }));
    } else if (drag.type === 'resize-bottom') {
      const startMin = timeToMinutes(drag.orig.start);
      const newEnd = clamp(currentStart, startMin + 30, END_HOUR*60);
      updateTask(drag.id, t => ({ ...t, dayIndex, end: minutesToTime(newEnd) }));
    }
  }, [drag, days, heightPx, updateTask]);

  const onMouseUp = useCallback(() => setDrag(null), []);

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    const title = editingTitle.trim();
    if (title && onChangeTasks) {
      updateTask(editingId, t => ({ ...t, title }));
    }
    setEditingId(null);
  }, [editingId, editingTitle, onChangeTasks, updateTask]);

  const removeSelected = useCallback(() => {
    if (!selectedId || !onChangeTasks) return;
    onChangeTasks(tasks.filter(t => t.id !== selectedId));
    setSelectedId(null);
  }, [onChangeTasks, selectedId, tasks]);

  return (
    <div
      ref={containerRef}
      className="flex overflow-auto outline-none"
      onMouseUp={onMouseUp}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Delete') {
          e.preventDefault();
          removeSelected();
        }
      }}
    >
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
        <div ref={gridRef} className="relative cursor-default select-none" onMouseMove={onMouseMove}>
          {/* hour rows background */}
          {hours.map((_, row) => (
            <div key={row} className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-zinc-200 dark:border-zinc-800" style={{ top: ${row*HOUR_PX}px}} />
          ))}
          {/* half-hour minor lines */}
          {hours.slice(0,-1).map((_, row) => (
            <div key={'h'+row} className="pointer-events-none absolute left-0 right-0 border-t border-zinc-100 dark:border-zinc-900" style={{ top: ${row*HOUR_PX+HOUR_PX/2}px}} />
          ))}
          {/* columns */}
          <div className="relative flex" style={{ height: ${(hours.length-1)*HOUR_PX}px}}>
            {dayLabels.map((_, col) => (
              <div key={col} className="relative flex-1 border-r" onDoubleClick={(e) => handleCreateAt(col, e.clientY)}>
                {/* tasks for this column */}
                {tasks.filter(t => t.dayIndex===col).map(t => {
                  const top = timeToOffsetPx(t.start);
                  const height = Math.max(HOUR_PX/2, minutesBetween(t.start, t.end) / 60 * HOUR_PX);
                  const isSel = selectedId===t.id;
                  const isEdit = editingId===t.id;
                  return (
                    <div key={t.id}
                         className={group absolute left-1 right-1 rounded-md border text-xs px-2 py-1 shadow-sm  }
                         style={{ top, height }}
                         title={${t.title} (-)}
                         onMouseDown={(e) => {
                           if (isEdit) return; // 编辑时不允许拖动
                           const target = e.target as HTMLElement;
                           if (target.dataset && target.dataset.handle) return;
                           const clone = e.altKey || e.ctrlKey;
                           if (clone && onChangeTasks) {
                             const copy: Task = { ...t, id: 't'+Math.random().toString(36).slice(2,8) };
                             onChangeTasks([...tasks, copy]);
                             setSelectedId(copy.id);
                             setDrag({ id: copy.id, type: 'move', startClientX: e.clientX, startClientY: e.clientY, orig: copy, duration: minutesBetween(copy.start, copy.end) });
                           } else {
                             setSelectedId(t.id);
                             setDrag({ id: t.id, type: 'move', startClientX: e.clientX, startClientY: e.clientY, orig: t, duration: minutesBetween(t.start, t.end) });
                           }
                         }}
                         onDoubleClick={(e) => { e.stopPropagation(); setEditingId(t.id); setEditingTitle(t.title); }}
                    >
                      {isEdit ? (
                        <input
                          autoFocus
                          className="w-full rounded border border-blue-400 bg-white/90 px-1 py-0.5 text-blue-900 outline-none dark:bg-zinc-900/90 dark:text-zinc-100"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key==='Enter') commitEdit();
                            if (e.key==='Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        <>
                          <div className="truncate">{t.title}</div>
                          <div className="opacity-70">{t.start} - {t.end}</div>
                          {/* resize handles */}
                          <div
                            data-handle
                            onMouseDown={(e) => { e.stopPropagation(); setSelectedId(t.id); setDrag({ id: t.id, type: 'resize-top', startClientX: e.clientX, startClientY: e.clientY, orig: t, duration: minutesBetween(t.start, t.end) }); }}
                            className="absolute -top-1 left-1 right-1 h-2 cursor-n-resize rounded bg-blue-400/50 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-blue-600/50"
                          />
                          <div
                            data-handle
                            onMouseDown={(e) => { e.stopPropagation(); setSelectedId(t.id); setDrag({ id: t.id, type: 'resize-bottom', startClientX: e.clientX, startClientY: e.clientY, orig: t, duration: minutesBetween(t.start, t.end) }); }}
                            className="absolute -bottom-1 left-1 right-1 h-2 cursor-s-resize rounded bg-blue-400/50 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-blue-600/50"
                          />
                        </>
                      )}
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
