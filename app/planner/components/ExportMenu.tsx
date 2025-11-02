'use client';

import type { Task } from './PlannerGrid';

function detectTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function pad(n: number) { return String(n).padStart(2,'0'); }

const COLOR_CANVAS: Record<string, {fill: string; stroke: string}> = {
  blue:   { fill: 'rgba(59,130,246,0.35)', stroke: '#2563eb' },
  green:  { fill: 'rgba(16,185,129,0.35)', stroke: '#10b981' },
  amber:  { fill: 'rgba(245,158,11,0.35)', stroke: '#f59e0b' },
  purple: { fill: 'rgba(168,85,247,0.35)', stroke: '#a855f7' },
  indigo: { fill: 'rgba(99,102,241,0.35)', stroke: '#6366f1' },
  rose:   { fill: 'rgba(244,63,94,0.35)', stroke: '#f43f5e' },
  gray:   { fill: 'rgba(113,113,122,0.35)', stroke: '#71717a' },
};

// Draw planner grid for day/week view into a canvas
function drawPlannerCanvas(canvas: HTMLCanvasElement, days: number, tasks: Task[], anchorDate: Date, opts?: { scale?: number }) {
  const START_HOUR = 6;
  const END_HOUR = 23;

  const scale = opts?.scale ?? 2; // HD export scale
  const hourRows = END_HOUR - START_HOUR; // 17
  const rowH = 48;
  const headerH = 36;
  const yAxisW = 64;
  const colW = 180;
  const width = yAxisW + days * colW;
  const height = headerH + hourRows * rowH;

  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  (ctx as any).scale?.(scale, scale);

  const theme = detectTheme();
  const colors = theme === 'dark' ? {
    bg: '#0a0a0a', fg: '#ededed', grid: '#222', gridMinor: '#161616', border: '#333'
  } : {
    bg: '#ffffff', fg: '#171717', grid: '#e5e7eb', gridMinor: '#f4f4f5', border: '#e4e4e7'
  };

  // background
  ctx.fillStyle = colors.bg; ctx.fillRect(0,0,width,height);

  // header background
  ctx.fillStyle = theme==='dark' ? '#0f0f10' : '#fafafa';
  ctx.fillRect(0,0,width,headerH);
  ctx.strokeStyle = colors.border; ctx.beginPath(); ctx.moveTo(0,headerH+0.5); ctx.lineTo(width,headerH+0.5); ctx.stroke();

  // day labels
  const base = new Date(anchorDate); base.setHours(0,0,0,0);
  ctx.fillStyle = colors.fg; ctx.font = '14px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let d=0; d<days; d++) {
    const date = new Date(base); date.setDate(base.getDate()+d);
    const label = `${date.getMonth()+1}/${date.getDate()}`;
    const x = yAxisW + d*colW + colW/2; const y = headerH/2;
    ctx.fillText(label, x, y);
  }

  // Y axis labels and grid
  ctx.textAlign = 'right'; ctx.font = '12px system-ui, sans-serif';
  for (let h=0; h<=hourRows; h++) {
    const hour = START_HOUR + h;
    const y = headerH + h*rowH;
    if (h>0) { ctx.strokeStyle = colors.grid; ctx.beginPath(); ctx.moveTo(0.5, y+0.5); ctx.lineTo(width, y+0.5); ctx.stroke(); }
    if (h<hourRows) { const yMinor = y + rowH/2; ctx.strokeStyle = colors.gridMinor; ctx.beginPath(); ctx.moveTo(yAxisW+0.5, yMinor+0.5); ctx.lineTo(width, yMinor+0.5); ctx.stroke(); }
    ctx.fillStyle = '#6b7280'; ctx.fillText(`${String(hour).padStart(2,'0')}:00`, yAxisW - 6, y + 2);
  }

  // vertical columns
  for (let d=0; d<days; d++) { const x = yAxisW + d*colW; ctx.strokeStyle = colors.border; ctx.beginPath(); ctx.moveTo(x+0.5, 0); ctx.lineTo(x+0.5, height); ctx.stroke(); }

  // tasks
  const rangeMinutes = (END_HOUR-START_HOUR)*60;
  function yFor(time: string) { const [hh,mm] = time.split(':').map(Number); const mins = (hh*60+mm) - START_HOUR*60; return headerH + (mins/rangeMinutes) * (hourRows*rowH); }

  // conflict detection per day
  const conflicts = new Set<string>();
  for (let d=0; d<days; d++) {
    const arr = tasks.filter(t=>t.dayIndex===d).sort((a,b)=> (a.start<b.start? -1:1));
    let prev: Task | null = null;
    for (const cur of arr) { if (prev) { if (cur.start < (prev as Task).end) { conflicts.add((prev as Task).id); conflicts.add(cur.id); } } prev = cur; }
  }

  for (const t of tasks) {
    const x = yAxisW + t.dayIndex*colW + 8;
    const y1 = yFor(t.start), y2 = yFor(t.end);
    const h = Math.max(20, y2 - y1), w = colW - 16;
    const isConflict = conflicts.has(t.id);
    const cc = COLOR_CANVAS[t.color || 'blue'];
    if (t.done) { ctx.fillStyle = 'rgba(16,185,129,0.35)'; ctx.strokeStyle = '#10b981'; }
    else if (isConflict) { ctx.fillStyle = 'rgba(239,68,68,0.35)'; ctx.strokeStyle = '#ef4444'; }
    else { ctx.fillStyle = cc.fill; ctx.strokeStyle = cc.stroke; }
    ctx.lineWidth = 1; (ctx as any).beginPath();
    if ((ctx as any).roundRect) { (ctx as any).roundRect(x, y1, w, h, 6); } else { ctx.rect(x, y1, w, h); }
    ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#111827'; if (detectTheme()==='dark') ctx.fillStyle = '#e5e7eb';
    ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const title = t.title + (t.done ? ' (已完成)' : '');
    ctx.fillText(title, x+8, y1+6, w-16);
    ctx.fillStyle = 'rgba(107,114,128,0.9)'; ctx.fillText(`${t.start} - ${t.end}`, x+8, y1+22, w-16);
    ctx.restore();
  }
}

export default function ExportMenu({ days, tasks, anchorDate }: { days: number; tasks: Task[]; anchorDate: Date }) {
  const filename = `planner_${new Date().getFullYear()}${pad(new Date().getMonth()+1)}${pad(new Date().getDate())}_${pad(new Date().getHours())}${pad(new Date().getMinutes())}.png`;
  return (
    <button className="rounded px-3 py-1 text-sm border" onClick={() => {
      const canvas = document.createElement('canvas');
      drawPlannerCanvas(canvas, days, tasks, anchorDate, { scale: 2 });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    }}>导出 PNG</button>
  );
}
