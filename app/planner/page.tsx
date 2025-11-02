import Toolbar from './components/Toolbar';
import PlannerGrid, { Task } from './components/PlannerGrid';

export default function PlannerPage() {
  // demo state - skeleton uses server component props; real state to be lifted to client when implementing interactions
  const days = 7; // default week view
  const view: 'day' | 'week' | 'month' = 'week';

  const tasks: Task[] = [
    { id: 't1', title: '晨读', dayIndex: 0, start: '07:00', end: '08:00' },
    { id: 't2', title: '工作-需求评审', dayIndex: 1, start: '10:30', end: '12:00' },
    { id: 't3', title: '午休', dayIndex: 2, start: '12:30', end: '13:30', done: true },
    { id: 't4', title: '学习-前端', dayIndex: 2, start: '20:00', end: '22:00' },
    { id: 't5', title: '运动', dayIndex: 4, start: '18:30', end: '19:30' },
  ];

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* toolbar rendered as client component wrapper */}
      {/* placeholder handlers until client state is wired */}
      <Toolbar
        view={view}
        onChangeView={() => { /* TODO: implement stateful client page */ }}
        days={days}
        onChangeDays={() => { /* TODO */ }}
      />
      <div className="flex-1">
        {/* Only implement day/week grid now; month view TBD */}
        <PlannerGrid days={days} tasks={tasks} />
      </div>
    </div>
  );
}
