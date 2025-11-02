'use client';

import { useMemo, useState } from 'react';
import Toolbar from './components/Toolbar';
import PlannerGrid, { Task } from './components/PlannerGrid';

type ViewMode = 'day' | 'week' | 'month';

export default function PlannerPage() {
  const [view, setView] = useState<ViewMode>('week');
  const [days, setDays] = useState<number>(7);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 't1', title: '晨读', dayIndex: 0, start: '07:00', end: '08:00' },
    { id: 't2', title: '工作-需求评审', dayIndex: 1, start: '10:30', end: '12:00' },
    { id: 't3', title: '午休', dayIndex: 2, start: '12:30', end: '13:30', done: true },
    { id: 't4', title: '学习-前端', dayIndex: 2, start: '20:00', end: '22:00' },
    { id: 't5', title: '运动', dayIndex: 4, start: '18:30', end: '19:30' },
  ]);

  // 在不同视图下可调整默认展示天数（此处保留简单逻辑）
  useMemo(() => {
    if (view === 'day' && days !== 3 && days !== 1) {
      // day 视图示例：默认显示 3 天窗口
      setDays(3);
    }
    if (view === 'week' && days !== 7) {
      setDays(7);
    }
  }, [view]);

  return (
    <div className="flex h-[100dvh] flex-col">
      <Toolbar
        view={view}
        onChangeView={(v) => setView(v)}
        days={days}
        onChangeDays={(n) => setDays(n)}
      />
      <div className="flex-1">
        {view === 'month' ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            月视图即将推出（当前以任务分布为主，不含细粒度时间轴）。
          </div>
        ) : (
          <PlannerGrid days={days} tasks={tasks} onChangeTasks={setTasks} />
        )}
      </div>
    </div>
  );
}
