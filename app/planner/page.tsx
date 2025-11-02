'use client';

import { useMemo, useState } from 'react';
import Toolbar from './components/Toolbar';
import PlannerGrid, { Task } from './components/PlannerGrid';
import ExportMenu from './components/ExportMenu';
import MonthView from './components/MonthView';

type ViewMode = 'day' | 'week' | 'month';

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth()+n, 1); }
function fmtMD(d: Date) { return `${d.getMonth()+1}/${d.getDate()}`; }

export default function PlannerPage() {
  const [view, setView] = useState<ViewMode>('week');
  const [days, setDays] = useState<number>(7);
  const [anchorDate, setAnchorDate] = useState<Date>(startOfDay(new Date()));
  const [tasks, setTasks] = useState<Task[]>([
    { id: 't1', title: '晨读', dayIndex: 0, start: '07:00', end: '08:00' },
    { id: 't2', title: '工作-需求评审', dayIndex: 1, start: '10:30', end: '12:00' },
    { id: 't3', title: '午休', dayIndex: 2, start: '12:30', end: '13:30', done: true },
    { id: 't4', title: '学习-前端', dayIndex: 2, start: '20:00', end: '22:00' },
    { id: 't5', title: '运动', dayIndex: 4, start: '18:30', end: '19:30' },
  ]);

  useMemo(() => {
    if (view === 'day' && days !== 3 && days !== 1) setDays(3);
    if (view === 'week' && days !== 7) setDays(7);
  }, [view]);

  const rangeLabel = useMemo(() => {
    if (view === 'month') {
      const m = anchorDate.getMonth()+1; const y = anchorDate.getFullYear();
      return `${y}年${m}月`;
    }
    const start = anchorDate;
    const end = addDays(anchorDate, days-1);
    return `${fmtMD(start)} - ${fmtMD(end)}`;
  }, [view, anchorDate, days]);

  const onPrev = () => {
    if (view === 'month') setAnchorDate(addMonths(startOfMonth(anchorDate), -1));
    else setAnchorDate(addDays(anchorDate, -days));
  };
  const onNext = () => {
    if (view === 'month') setAnchorDate(addMonths(startOfMonth(anchorDate), 1));
    else setAnchorDate(addDays(anchorDate, days));
  };
  const onToday = () => setAnchorDate(startOfDay(new Date()));

  return (
    <div className="flex h-[100dvh] flex-col">
      <Toolbar
        view={view}
        onChangeView={(v) => setView(v)}
        days={days}
        onChangeDays={(n) => setDays(n)}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
        rangeLabel={rangeLabel}
        extraRight={<ExportMenu days={days} tasks={tasks} anchorDate={anchorDate} />}
      />
      <div className="flex-1">
        {view === 'month' ? (
          <MonthView tasks={tasks} anchorDate={anchorDate} />
        ) : (
          <PlannerGrid days={days} tasks={tasks} onChangeTasks={setTasks} anchorDate={anchorDate} />
        )}
      </div>
    </div>
  );
}
