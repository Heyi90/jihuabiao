'use client';

import type React from 'react';
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
  anchorDate?: Date; // the date corresponding to dayIndex=0
};

const HOUR_PX = 48; // pixels per hour
const START_HOUR = 6;
const END_HOUR = 23; // end bound (exclusive for height)
const RANGE_MINUTES = (END_HOUR - START_HOUR) * 60;
const SNAP_MIN = 15; // snap-to-neighbor threshold in minutes

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function timeToMinutes(t: string) { const [hh, mm] = t.split(':').map(Number); return hh*60+mm; }
function minutesToTime(m: number) { const hh = Math.floor(m/60), mm = m%60; return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; }
function snap30(mins: number) { return Math.round(mins/30)*30; }
function timeToOffsetPx(t: string) {
  const mins = timeToMinutes(t) - START_HOUR*60; // relative to 06:00
  const frac = clamp(mins / RANGE_MINUTES, 0, 1);
  return frac * ((END_HOUR - START_HOUR) * HOUR_PX);
}
function minutesBetween(start: string, end: string) { return timeToMinutes(end) - timeToMinutes(start); }

// collect neighbor boundaries for snap (start/end minutes of tasks in same day)
function dayBoundaries(tasks: Task[], dayIndex: number, excludeId?: string) {
  const set = new Set<number>();
  for (const t of tasks) {
    if (t.dayIndex !== dayIndex || t.id === excludeId) continue;
    set.add(timeToMinutes(t.start));
    set.add(timeToMinutes(t.end));
  }
  return Array.from(set.values()).sort((a,b)=>a-b);
}

// compute overlapping tasks (same column)
function computeConflicts(tasks: Task[]) {
  const conflicts = new Set<string>();
  const byDay = new Map<number, Task[]>();
  for (const t of tasks) {
    const arr = byDay.get(t.dayIndex) ?? [];
    arr.push(t); byDay.set(t.dayIndex, arr);
  }
  for (const arr of byDay.values()) {
    const sorted = arr.slice().sort((a,b)=> timeToMinutes(a.start) - timeToMinutes(b.start));
    let prev: Task | null = null;
    for (const cur of sorted) {
      if (prev) {
        if (timeToMinutes(cur.start) < timeToMinutes(prev.end)) {
          conflicts.add(prev.id); conflicts.add(cur.id);
        }
      }
      if (!prev || timeToMinutes(cur.end) > timeToMinutes(prev.end)) prev = cur;
    }
  }
  return conflicts;
}

export default function PlannerGrid({ days, tasks, onChangeTasks, anchorDate }: Props) {
  const hours = hoursRange(START_HOUR, END_HOUR);
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<null | { id: string; type: 'move' | 'resize-top' | 'resize-bottom'; startClientX: number; startClientY: number; orig: Task; duration: number; }>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [guideY, setGuideY] = useState<number | null>(null); // snap guide line

  const heightPx = (hours.length - 1) * HOUR_PX;

  const dayLabels = useMemo(() => {
    const base = new Date(anchorDate ?? new Date()); base.setHours(0,0,0,0);
    return Array.from({length: days}, (_, i) => {
      const d = new Date(base); d.setDate(base.getDate() + i);
      return `${d.getMonth()+1}/${d.getDate()}`;
    });
  }, [days, anchorDate]);

  const conflictIds = useMemo(() => computeConflicts(tasks), [tasks]);

  const updateTask = useCallback((id: string, updater: (t: Task) => Task) => {
    if (!onChangeTasks) return;
    onChangeTasks(tasks.map(t => t.id===id ? updater(t) : t));
  }, [tasks, onChangeTasks]);

  const toggleDone = useCallback((id: string) => { updateTask(id, t => ({ ...t, done: !t.done })); }, [updateTask]);

  const handleCreateAt = useCallback((col: number, clientY: number) => {
    if (!onChangeTasks || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const relY = clamp(clientY - rect.top, 0, heightPx);
    const minutesFromStart = snap30(Math.round(relY / heightPx * RANGE_MINUTES));
    let startMin = START_HOUR*60 + minutesFromStart;
    let endMin = startMin + 60; // default 60min
    if (endMin > END_HOUR*60) { endMin = END_HOUR*60; startMin = Math.max(START_HOUR*60, endMin - 60); }
    const newTask: Task = { id: 't' + Math.random().toString(36).slice(2,8), title: '新任务', dayIndex: clamp(col, 0, days-1), start: minutesToTime(startMin), end: minutesToTime(endMin) };
    onChangeTasks([...tasks, newTask]);
    setSelectedId(newTask.id);
  }, [days, heightPx, onChangeTasks, tasks]);

  const snapToNeighbors = useCallback((dayIndex: number, minsAbs: number, excludeId?: string) => {
    const boundaries = dayBoundaries(tasks, dayIndex, excludeId);
    for (const b of boundaries) { if (Math.abs(b - minsAbs) <= SNAP_MIN) return b; }
    return null;
  }, [tasks]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const colWidth = rect.width / days;
    const relX = clamp(e.clientX - rect.left, 0, rect.width - 1);
    const relY = clamp(e.clientY - rect.top, 0, heightPx);
    const dayIndex = clamp(Math.floor(relX / colWidth), 0, days-1);

    // relative minutes from 06:00
    let minutesFromStart = Math.round(relY / heightPx * RANGE_MINUTES);
    let minsAbs = START_HOUR*60 + minutesFromStart;
    const snappedAbs = snapToNeighbors(dayIndex, minsAbs, drag.id);
    if (snappedAbs != null) {
      minsAbs = snappedAbs;
      minutesFromStart = minsAbs - START_HOUR*60;
      setGuideY((minutesFromStart / RANGE_MINUTES) * ((END_HOUR-START_HOUR)*HOUR_PX));
    } else {
      setGuideY(null);
    }

    const snappedFromStart = snap30(minutesFromStart);
    const currentStart = START_HOUR*60 + snappedFromStart;

    if (drag.type === 'move') {
      const newStart = clamp(currentStart, START_HOUR*60, END_HOUR*60);
      let newEnd = newStart + drag.duration;
      if (newEnd > END_HOUR*60) newEnd = END_HOUR*60;
      const fixedStart = newEnd - drag.duration; // keep duration
      updateTask(drag.id, t => ({ ...t, dayIndex, start: minutesToTime(fixedStart), end: minutesToTime(newEnd) }));
    } else if (drag.type === 'resize-top') {
      const endMin = timeToMinutes(drag.orig.end);
      const newStart = clamp(currentStart, START_HOUR*60, endMin - 30);
      updateTask(drag.id, t => ({ ...t, dayIndex, start: minutesToTime(newStart) }));
    } else if (drag.type === 'resize-bottom') {
      const startMin = timeToMinutes(drag.orig.start);
      const newEnd = clamp(currentStart, startMin + 30, END_HOUR*60);
      updateTask(drag.id, t => ({ ...t, dayIndex, end: minutesToTime(newEnd) }));
    }
  }, [days, drag, heightPx, updateTask, snapToNeighbors]);

  const onMouseUp = useCallback(() => { setDrag(null); setGuideY(null); }, []);

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    const title = editingTitle.trim();
    if (title && onChangeTasks) updateTask(editingId, t => ({ ...t, title }));
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
        if (e.key === 'Delete') { e.preventDefault(); removeSelected(); }
        if (e.key === 'Escape') { e.preventDefault(); setSelectedId(null); }
        if (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space') { e.preventDefault(); if (selectedId) toggleDone(selectedId); }
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
          {hours.map((_, row) => (
            <div key={row} className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-zinc-200 dark:border-zinc-800" style={{ top: `${row*HOUR_PX}px`}} />
          ))}
          {hours.slice(0,-1).map((_, row) => (
            <div key={'h'+row} className="pointer-events-none absolute left-0 right-0 border-t border-zinc-100 dark:border-zinc-900" style={{ top: `${row*HOUR_PX+HOUR_PX/2}px`}} />
          ))}

          {guideY!=null && (
            <div className="pointer-events-none absolute left-0 right-0 border-t border-blue-400/70 dark:border-blue-500/70" style={{ top: `${guideY}px`}} />
          )}

          <div className="relative flex" style={{ height: `${(hours.length-1)*HOUR_PX}px`}}>
            {dayLabels.map((_, col) => (
              <div key={col} className="relative flex-1 border-r" onDoubleClick={(e) => handleCreateAt(col, e.clientY)}>
                {tasks.filter(t => t.dayIndex===col).map(t => {
                  const top = timeToOffsetPx(t.start);
                  const height = Math.max(HOUR_PX/2, minutesBetween(t.start, t.end) / 60 * HOUR_PX);
                  const isSel = selectedId===t.id;
                  const isEdit = editingId===t.id;
                  const isConflict = conflictIds.has(t.id);
                  return (
                    <div key={t.id}
                         className={`group absolute left-1 right-1 rounded-md border text-xs px-2 py-1 shadow-sm ${t.done? 'bg-green-200/60 border-green-300 text-green-900 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200 line-through' : isConflict? 'bg-red-100/60 border-red-300 text-red-900 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200' : 'bg-blue-100/60 border-blue-300 text-blue-900 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200'} ${isSel?'ring-2 ring-blue-400':''}`}
                         style={{ top, height }}
                         title={`${t.title} (${t.start}-${t.end})`}
                         onMouseDown={(e) => {
                           if (isEdit) return; // no drag while editing
                           const target = e.target as HTMLElement;
                           if (target.dataset && (target.dataset as any).handle) return;
                           const clone = (e as any).altKey || (e as any).ctrlKey;
                           if (clone && onChangeTasks) {
                             const copy: Task = { ...t, id: 't'+Math.random().toString(36).slice(2,8) };
                             onChangeTasks([...tasks, copy]);
                             setSelectedId(copy.id);
                             setDrag({ id: copy.id, type: 'move', startClientX: (e as any).clientX, startClientY: (e as any).clientY, orig: copy, duration: minutesBetween(copy.start, copy.end) });
                           } else {
                             setSelectedId(t.id);
                             setDrag({ id: t.id, type: 'move', startClientX: (e as any).clientX, startClientY: (e as any).clientY, orig: t, duration: minutesBetween(t.start, t.end) });
                           }
                         }}
                         onDoubleClick={(e) => { (e as any).stopPropagation(); setEditingId(t.id); setEditingTitle(t.title); }}
                    >
                      {isEdit ? (
                        <input
                          autoFocus
                          className="w-full rounded border border-blue-400 bg-white/90 px-1 py-0.5 text-blue-900 outline-none dark:bg-zinc-900/90 dark:text-zinc-100"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle((e as any).target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if ((e as any).key==='Enter') commitEdit(); if ((e as any).key==='Escape') setEditingId(null); }}
                        />
                      ) : (
                        <>
                          <div className="truncate flex items-center justify-between">
                            <span>{t.title}</span>
                            <div className="flex items-center gap-2">
                              {isConflict && <span className="ml-1 rounded bg-red-500/80 px-1 text-[10px] leading-4 text-white">冲突</span>}
                              <button aria-label="toggle done" className={`h-4 w-4 rounded border text-[10px] leading-3 ${t.done?'bg-green-500 text-white border-green-600':'bg-white/60 dark:bg-zinc-900/60'}`} onClick={(e) => { (e as any).stopPropagation(); toggleDone(t.id); }}>{t.done ? 'x' : ''}</button>
                            </div>
                          </div>
                          <div className="opacity-70">{t.start} - {t.end}</div>
                          <div data-handle onMouseDown={(e) => { (e as any).stopPropagation(); setSelectedId(t.id); setDrag({ id: t.id, type: 'resize-top', startClientX: (e as any).clientX, startClientY: (e as any).clientY, orig: t, duration: minutesBetween(t.start, t.end) }); }} className="absolute -top-1 left-1 right-1 h-2 cursor-n-resize rounded bg-blue-400/50 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-blue-600/50" />
                          <div data-handle onMouseDown={(e) => { (e as any).stopPropagation(); setSelectedId(t.id); setDrag({ id: t.id, type: 'resize-bottom', startClientX: (e as any).clientX, startClientY: (e as any).clientY, orig: t, duration: minutesBetween(t.start, t.end) }); }} className="absolute -bottom-1 left-1 right-1 h-2 cursor-s-resize rounded bg-blue-400/50 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-blue-600/50" />
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
