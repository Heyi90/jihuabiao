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
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'indigo' | 'rose' | 'gray';
};

type Props = {
  days: number;
  tasks: Task[];
  onChangeTasks?: (tasks: Task[]) => void;
  anchorDate?: Date;
  onSelectTasks?: (ids: string[]) => void;
};

const HOUR_PX = 48;
const START_HOUR = 6;
const END_HOUR = 23;
const RANGE_MINUTES = (END_HOUR - START_HOUR) * 60;
const SNAP_MIN = 15;

const COLOR_STYLES: Record<string, {bg: string; border: string; text: string; darkBg: string; darkBorder: string; darkText: string;}> = {
  blue:   { bg: 'bg-blue-100/60',   border: 'border-blue-300',   text: 'text-blue-900',   darkBg: 'dark:bg-blue-900/30',   darkBorder: 'dark:border-blue-800',   darkText: 'dark:text-blue-200' },
  green:  { bg: 'bg-green-100/60',  border: 'border-green-300',  text: 'text-green-900',  darkBg: 'dark:bg-green-900/30',  darkBorder: 'dark:border-green-800',  darkText: 'dark:text-green-200' },
  amber:  { bg: 'bg-amber-100/60',  border: 'border-amber-300',  text: 'text-amber-900',  darkBg: 'dark:bg-amber-900/30',  darkBorder: 'dark:border-amber-800',  darkText: 'dark:text-amber-200' },
  purple: { bg: 'bg-purple-100/60', border: 'border-purple-300', text: 'text-purple-900', darkBg: 'dark:bg-purple-900/30', darkBorder: 'dark:border-purple-800', darkText: 'dark:text-purple-200' },
  indigo: { bg: 'bg-indigo-100/60', border: 'border-indigo-300', text: 'text-indigo-900', darkBg: 'dark:bg-indigo-900/30', darkBorder: 'dark:border-indigo-800', darkText: 'dark:text-indigo-200' },
  rose:   { bg: 'bg-rose-100/60',   border: 'border-rose-300',   text: 'text-rose-900',   darkBg: 'dark:bg-rose-900/30',   darkBorder: 'dark:border-rose-800',   darkText: 'dark:text-rose-200' },
  gray:   { bg: 'bg-zinc-100/60',   border: 'border-zinc-300',   text: 'text-zinc-900',   darkBg: 'dark:bg-zinc-900/30',   darkBorder: 'dark:border-zinc-800',   darkText: 'dark:text-zinc-200' },
};

function colorClasses(t: Task) {
  const c = t.color || 'blue';
  const s = COLOR_STYLES[c];
  return `${s.bg} ${s.border} ${s.text} ${s.darkBg} ${s.darkBorder} ${s.darkText}`;
}

function ringClass(t: Task) {
  const c = t.color || 'blue';
  switch (c) {
    case 'green': return 'ring-green-400';
    case 'amber': return 'ring-amber-400';
    case 'purple': return 'ring-purple-400';
    case 'indigo': return 'ring-indigo-400';
    case 'rose': return 'ring-rose-400';
    case 'gray': return 'ring-zinc-400';
    default: return 'ring-blue-400';
  }
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function timeToMinutes(t: string) { const [hh, mm] = t.split(':').map(Number); return hh*60+mm; }
function minutesToTime(m: number) { const hh = Math.floor(m/60), mm = m%60; return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; }
function snap30(mins: number) { return Math.round(mins/30)*30; }
function timeToOffsetPx(t: string) {
  const mins = timeToMinutes(t) - START_HOUR*60;
  const frac = clamp(mins / RANGE_MINUTES, 0, 1);
  return frac * ((END_HOUR - START_HOUR) * HOUR_PX);
}
function minutesBetween(start: string, end: string) { return timeToMinutes(end) - timeToMinutes(start); }

export default function PlannerGrid({ days, tasks, onChangeTasks, anchorDate, onSelectTasks }: Props) {
  const hours = hoursRange(START_HOUR, END_HOUR);
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drag, setDrag] = useState<null | (
    { type: 'move'; ids: string[]; anchorId: string; origs: Record<string, Task>; startClientX: number; startClientY: number; }
    | { type: 'resize-top' | 'resize-bottom'; id: string; orig: Task; startClientX: number; startClientY: number; }
  )>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [guideY, setGuideY] = useState<number | null>(null);
  const [marquee, setMarquee] = useState<null | {startX:number; startY:number; x:number; y:number}>(null);

  const heightPx = (hours.length - 1) * HOUR_PX;
    const nowLine = useMemo(() => {
    // Compute current time and day using Beijing time (Asia/Shanghai)
    const dtfYMD = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
    const dtfHM = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false });

    const beijingYMD = (d: Date) => {
      const s = dtfYMD.format(d); // e.g. 2025-11-05
      const [y, m, d2] = s.split('-').map(Number);
      return { y, m, d: d2 };
    };
    const serialDay = (ymd: {y:number;m:number;d:number}) => Math.floor(Date.UTC(ymd.y, ymd.m-1, ymd.d) / 86400000);

    const baseYMD = beijingYMD(anchorDate ?? new Date());
    const todayYMD = beijingYMD(new Date());
    const dayIndex = serialDay(todayYMD) - serialDay(baseYMD);
    if (dayIndex < 0 || dayIndex >= days) return null;

    const parts = dtfHM.formatToParts(new Date());
    const hh = parts.find(p=>p.type==='hour')?.value ?? '00';
    const mm = parts.find(p=>p.type==='minute')?.value ?? '00';
    const y = timeToOffsetPx(`${hh}:${mm}`);
    return { dayIndex, y } as { dayIndex:number; y:number };
  }, [anchorDate, days]);

  const dayLabels = useMemo(() => {
    const base = new Date(anchorDate ?? new Date()); base.setHours(0,0,0,0);
    return Array.from({length: days}, (_, i) => { const d = new Date(base); d.setDate(base.getDate() + i); return `${d.getMonth()+1}/${d.getDate()}`; });
  }, [days, anchorDate]);

  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    const byDay = new Map<number, Task[]>();
    for (const t of tasks) { const arr = byDay.get(t.dayIndex) ?? []; arr.push(t); byDay.set(t.dayIndex, arr); }
    for (const arr of byDay.values()) {
      const sorted = arr.slice().sort((a,b)=> timeToMinutes(a.start) - timeToMinutes(b.start));
      let prev: Task | null = null;
      for (const cur of sorted) {
        if (prev && timeToMinutes(cur.start) < timeToMinutes(prev.end)) { ids.add(prev.id); ids.add(cur.id); }
        if (!prev || timeToMinutes(cur.end) > timeToMinutes(prev.end)) prev = cur;
      }
    }
    return ids;
  }, [tasks]);

  const setSel = (ids: string[]) => { setSelectedIds(ids); onSelectTasks?.(ids); };

  const beginMarquee = (e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    setMarquee({ startX: e.clientX - rect.left, startY: e.clientY - rect.top, x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSel([]);
  };
  const updateMarquee = (e: React.MouseEvent) => {
    if (!marquee || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const mx1 = Math.min(marquee.startX, x), mx2 = Math.max(marquee.startX, x);
    const my1 = Math.min(marquee.startY, y), my2 = Math.max(marquee.startY, y);
    const colWidth = rect.width / days;
    const next: string[] = [];
    for (let col=0; col<days; col++) {
      const colX1 = col*colWidth, colX2 = (col+1)*colWidth;
      const overlapX = !(mx2 < colX1 || mx1 > colX2);
      if (!overlapX) continue;
      const colTasks = tasks.filter(t=>t.dayIndex===col);
      for (const t of colTasks) {
        const top = timeToOffsetPx(t.start);
        const h = Math.max(HOUR_PX/2, minutesBetween(t.start, t.end)/60 * HOUR_PX);
        const ty1 = top, ty2 = top + h;
        const overlapY = !(my2 < ty1 || my1 > ty2);
        if (overlapY) next.push(t.id);
      }
    }
    setMarquee({ ...marquee, x, y });
    setSel(next);
  };
  const endMarquee = () => setMarquee(null);

  const handleCreateAt = useCallback((col: number, clientY: number) => {
    if (!onChangeTasks || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const relY = clamp(clientY - rect.top, 0, heightPx);
    const minutesFromStart = snap30(Math.round(relY / heightPx * RANGE_MINUTES));
    let startMin = START_HOUR*60 + minutesFromStart;
    let endMin = startMin + 60;
    if (endMin > END_HOUR*60) { endMin = END_HOUR*60; startMin = Math.max(START_HOUR*60, endMin - 60); }
    const newTask: Task = { id: 't' + Math.random().toString(36).slice(2,8), title: 'New Task'blue' };
    onChangeTasks([...tasks, newTask]);
    setSel([newTask.id]);
  }, [days, heightPx, onChangeTasks, tasks]);

  const onMouseMoveGrid = useCallback((e: React.MouseEvent) => {
    if (drag && gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const colWidth = rect.width / days;
      const relX = clamp(e.clientX - rect.left, 0, rect.width - 1);
      const relY = clamp(e.clientY - rect.top, 0, heightPx);
      const dayIndex = clamp(Math.floor(relX / colWidth), 0, days-1);
      let minutesFromStart = Math.round(relY / heightPx * RANGE_MINUTES);
      let minsAbs = START_HOUR*60 + minutesFromStart;
      // snap to neighbor for anchor column only (simple)
      const boundaries = (() => {
        const set = new Set<number>();
        for (const t of tasks) {
          if ('type' in drag && drag.type==='move') {
            const anchorOrig = drag.origs[drag.anchorId];
            if (t.dayIndex!==anchorOrig.dayIndex) continue;
          }
        }
        return Array.from(set.values()).sort((a,b)=>a-b);
      })();
      const near = boundaries.find(b => Math.abs(b - minsAbs) <= SNAP_MIN);
      if (near!=null) { minsAbs = near; minutesFromStart = minsAbs - START_HOUR*60; setGuideY((minutesFromStart / RANGE_MINUTES) * ((END_HOUR-START_HOUR)*HOUR_PX)); } else { setGuideY(null); }
      const snappedFromStart = snap30(minutesFromStart);
      const currentStart = START_HOUR*60 + snappedFromStart;

      if (drag.type === 'move') {
        const anchorOrig = drag.origs[drag.anchorId];
        const deltaDay = dayIndex - anchorOrig.dayIndex;
        const deltaMin = currentStart - timeToMinutes(anchorOrig.start);
        if (onChangeTasks) {
          const idsSet = new Set(drag.ids);
          const newTasks = tasks.map(t => {
            if (!idsSet.has(t.id)) return t;
            const orig = drag.origs[t.id];
            let newDay = clamp(orig.dayIndex + deltaDay, 0, days-1);
            let startMin = clamp(timeToMinutes(orig.start) + deltaMin, START_HOUR*60, END_HOUR*60);
            let endMin = startMin + minutesBetween(orig.start, orig.end);
            if (endMin > END_HOUR*60) { endMin = END_HOUR*60; startMin = Math.max(START_HOUR*60, endMin - minutesBetween(orig.start, orig.end)); }
            return { ...t, dayIndex: newDay, start: minutesToTime(startMin), end: minutesToTime(endMin) };
          });
          onChangeTasks(newTasks);
        }
      } else if (drag.type === 'resize-top') {
        const endMin = timeToMinutes(drag.orig.end);
        const newStart = clamp(currentStart, START_HOUR*60, endMin - 30);
        if (onChangeTasks) {
          onChangeTasks(tasks.map(t => t.id===drag.id ? { ...t, start: minutesToTime(newStart) } : t));
        }
      } else if (drag.type === 'resize-bottom') {
        const startMin = timeToMinutes(drag.orig.start);
        const newEnd = clamp(currentStart, startMin + 30, END_HOUR*60);
        if (onChangeTasks) {
          onChangeTasks(tasks.map(t => t.id===drag.id ? { ...t, end: minutesToTime(newEnd) } : t));
        }
      }
    }
    if (marquee) updateMarquee(e);
  }, [drag, days, heightPx, tasks, onChangeTasks, marquee]);

  const onMouseUp = useCallback(() => { setDrag(null); setGuideY(null); endMarquee(); }, []);

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    const title = editingTitle.trim();
    if (title && onChangeTasks) {
      onChangeTasks(tasks.map(t => t.id===editingId ? { ...t, title } : t));
    }
    setEditingId(null);
  }, [editingId, editingTitle, onChangeTasks, tasks]);

  const removeSelected = useCallback(() => {
    if (!selectedIds.length || !onChangeTasks) return;
    onChangeTasks(tasks.filter(t => !selectedIds.includes(t.id)));
    setSel([]);
  }, [onChangeTasks, selectedIds, tasks]);

  const isOnCard = (el: HTMLElement | null) => {
    return !!el?.closest('[data-card="1"]');
  };

  return (
    <div ref={containerRef} className="flex overflow-auto outline-none" onMouseUp={onMouseUp} tabIndex={0} onKeyDown={(e) => {
      if (e.key === 'Delete') { e.preventDefault(); removeSelected(); }
      if (e.key === 'Escape') { e.preventDefault(); setSel([]); }
      if (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space') { e.preventDefault(); if (selectedIds.length && onChangeTasks) { const set = new Set(selectedIds); const next = tasks.map(t => set.has(t.id) ? { ...t, done: !t.done } : t); onChangeTasks(next); } }
    }}>
      <TimelineY />
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 flex bg-background/95 backdrop-blur border-b">
          {dayLabels.map((label, i) => (<div key={i} className="flex-1 border-r px-2 py-2 text-center text-sm text-zinc-700">{label}</div>))}
        </div>
        <div ref={gridRef} className="relative cursor-default select-none" onMouseMove={onMouseMoveGrid} onMouseDown={(e)=>{ const el = e.target as HTMLElement; if (!isOnCard(el)) beginMarquee(e); }}>
          {hours.map((_, row) => (<div key={row} className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-zinc-200 dark:border-zinc-800" style={{ top: `${row*HOUR_PX}px`}} />))}
          {hours.slice(0,-1).map((_, row) => (<div key={'h'+row} className="pointer-events-none absolute left-0 right-0 border-t border-zinc-100 dark:border-zinc-900" style={{ top: `${row*HOUR_PX+HOUR_PX/2}px`}} />))}
          {guideY!=null && (<div className="pointer-events-none absolute left-0 right-0 border-t border-blue-400/70 dark:border-blue-500/70" style={{ top: `${guideY}px`}} />)}
          {marquee && (<div className="pointer-events-none absolute border border-blue-400/70 bg-blue-400/10" style={{ left: `${Math.min(marquee.startX, marquee.x)}px`, top: `${Math.min(marquee.startY, marquee.y)}px`, width: `${Math.abs(marquee.x - marquee.startX)}px`, height: `${Math.abs(marquee.y - marquee.startY)}px`}} />)}

          <div className="relative flex" style={{ height: `${(hours.length-1)*HOUR_PX}px`}}>
            {dayLabels.map((_, col) => (
              <div key={col} className="relative flex-1 border-r" onDoubleClick={(e) => handleCreateAt(col, e.clientY)}>
                {nowLine && nowLine.dayIndex===col && (<div className="pointer-events-none absolute left-0 right-0 border-t border-red-500/80" style={{ top: `${nowLine.y}px`}} />)}
                {tasks.filter(t => t.dayIndex===col).map(t => {
                  const top = timeToOffsetPx(t.start);
                  const height = Math.max(HOUR_PX/2, minutesBetween(t.start, t.end) / 60 * HOUR_PX);
                  const isSel = selectedIds.includes(t.id);
                  const isEdit = editingId===t.id;
                  const isConflict = conflictIds.has(t.id);
                  const colorCls = colorClasses(t);
                  const ringCls = ringClass(t);
                  return (
                    <div key={t.id} data-card="1"
                      className={`group absolute left-1 right-1 rounded-md border text-xs px-2 py-1 shadow-sm hover:shadow ring-1 ring-transparent hover:ring-zinc-300 transition ${isConflict? 'bg-red-100/60 border-red-300 text-red-900 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200' : (t.done? colorCls + ' line-through opacity-80' : colorCls)} ${isSel?('ring-2 ' + ringCls):''}`}
                      style={{ top, height }}
                      title={`${t.title} (${t.start}-${t.end})`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (isEdit) return;
                        const target = e.target as HTMLElement; if (target.dataset && (target.dataset as any).handle) return;
                        const cloneDrag = (e as any).altKey || (e as any).ctrlKey;
                        // determine dragging ids
                        let idsToUse = selectedIds.includes(t.id) ? selectedIds : [t.id];
                        // if cloning selected group
                        if (cloneDrag && onChangeTasks) {
                          const idSet = new Set(idsToUse);
                          const copies: Task[] = tasks.filter(x=>idSet.has(x.id)).map(x=> ({ ...x, id: 't'+Math.random().toString(36).slice(2,8) }));
                          const newTasks = [...tasks, ...copies];
                          onChangeTasks(newTasks);
                          idsToUse = copies.map(c=>c.id);
                          const origs: Record<string, Task> = {}; copies.forEach(c=>{ origs[c.id]=c; });
                          setSel(idsToUse);
                          setDrag({ type: 'move', ids: idsToUse, anchorId: idsToUse[0], origs, startClientX: (e as any).clientX, startClientY: (e as any).clientY });
                        } else {
                          // start move for group or single
                          const idSet = new Set(idsToUse);
                          const origs: Record<string, Task> = {}; tasks.forEach(x=>{ if (idSet.has(x.id)) origs[x.id]=x; });
                          if (!selectedIds.includes(t.id) && !(e as any).shiftKey) setSel([t.id]);
                          setDrag({ type: 'move', ids: idsToUse, anchorId: idsToUse[0], origs, startClientX: (e as any).clientX, startClientY: (e as any).clientY });
                        }
                      }}
                      onDoubleClick={(e)=>{ (e as any).stopPropagation(); setEditingId(t.id); setEditingTitle(t.title); }}
                    >
                      {isEdit ? (
                        <input autoFocus className="w-full rounded border border-blue-400 bg-white/90 px-1 py-0.5 text-blue-900 outline-none dark:bg-zinc-900/90 dark:text-zinc-100" value={editingTitle} onChange={(e) => setEditingTitle((e as any).target.value)} onBlur={commitEdit} onKeyDown={(e) => { if ((e as any).key==='Enter') commitEdit(); if ((e as any).key==='Escape') setEditingId(null); }} />
                      ) : (
                        <>
                          <div className="truncate flex items-center justify-between">
                            <span>{t.title}</span>
                            <div className="flex items-center gap-2">
                              {isConflict && <span className="ml-1 rounded bg-red-500/80 px-1 text-[10px] leading-4 text-white">CONF</span>}
                              <button aria-label="toggle done" className={`h-4 w-4 rounded border text-[10px] leading-3 ${t.done?'bg-green-500 text-white border-green-600':'bg-white/60 dark:bg-zinc-900/60'}`} onClick={(e) => { (e as any).stopPropagation(); onChangeTasks?.(tasks.map(x=> x.id===t.id ? { ...x, done: !x.done } : x)); }}>{t.done ? '閴? : ''}</button>
                            </div>
                          </div>
                          <div className="opacity-70">{t.start} - {t.end}</div>
                          <div data-handle onMouseDown={(e) => { (e as any).stopPropagation(); setSel([t.id]); setDrag({ type: 'resize-top', id: t.id, orig: t, startClientX: (e as any).clientX, startClientY: (e as any).clientY }); }} className="absolute -top-1 left-1 right-1 h-2 cursor-n-resize rounded bg-blue-400/50 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-blue-600/50" />
                          <div data-handle onMouseDown={(e) => { (e as any).stopPropagation(); setSel([t.id]); setDrag({ type: 'resize-bottom', id: t.id, orig: t, startClientX: (e as any).clientX, startClientY: (e as any).clientY }); }} className="absolute -bottom-1 left-1 right-1 h-2 cursor-s-resize rounded bg-blue-400/50 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-blue-600/50" />
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












