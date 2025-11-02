'use client';

import { useMemo } from 'react';
import type { Task } from './PlannerGrid';

const START_HOUR = 6;
const END_HOUR = 23;

function pad(n: number) { return String(n).padStart(2,'0'); }

function detectTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function drawPlannerCanvas(canvas: HTMLCanvasElement, days: number, tasks: Task[], opts?: { scale?: number }) {
  const scale = opts?.scale ?? 2; // export scale for HiDPI
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
  ctx.scale(scale, scale);

  const theme = detectTheme();
  const colors = theme === 'dark' ? {
    bg: '#0a0a0a', fg: '#ededed', grid: '#222', gridMinor: '#161616', border: '#333',
    blue: '#60a5fa', blueFill: 'rgba(37,99,235,0.35)', green: 'rgba(16,185,129,0.35)', greenBorder: '#10b981',
    red: 'rgba(239,68,68,0.35)', redBorder: '#ef4444'
  } : {
    bg: '#ffffff', fg: '#171717', grid: '#e5e7eb', gridMinor: '#f4f4f5', border: '#e4e4e7',
    blue: '#2563eb', blueFill: 'rgba(59,130,246,0.35)', green: 'rgba(16,185,129,0.35)', greenBorder: '#10b981',
    red: 'rgba(239,68,68,0.35)', redBorder: '#ef4444'
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

  // Y axis labels
  ctx.textAlign = 'right'; ctx.font = '12px system-ui, sans-serif';
  for (let h=0; h<=hourRows; h++) {
    const hour = START_HOUR + h;
    const y = headerH + h*rowH;
    if (h>0) { // grid lines
      ctx.strokeStyle = colors.grid; ctx.beginPath(); ctx.moveTo(0.5, y+0.5); ctx.lineTo(width, y+0.5); ctx.stroke();
    }
    if (h<hourRows) {
      // minor half-hour
      const yMinor = y + rowH/2;
      ctx.strokeStyle = colors.gridMinor; ctx.beginPath(); ctx.moveTo(yAxisW+0.5, yMinor+0.5); ctx.lineTo(width, yMinor+0.5); ctx.stroke();
    }
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`${pad(hour)}:00`, yAxisW - 6, y + 2);
  }

  // vertical columns
  for (let d=0; d<days; d++) {
    const x = yAxisW + d*colW;
    ctx.strokeStyle = colors.border; ctx.beginPath(); ctx.moveTo(x+0.5, 0); ctx.lineTo(x+0.5, height); ctx.stroke();
  }

  // tasks
  const rangeMinutes = (END_HOUR-START_HOUR)*60;
  function yFor(time: string) {
    const [hh,mm] = time.split(':').map(Number);
    const mins = (hh*60+mm) - START_HOUR*60;
    return headerH + (mins/rangeMinutes) * (hourRows*rowH);
  }

  const conflicts = new Set<string>();
  // simple conflict detection per day
  for (let d=0; d<days; d++) {
    const arr = tasks.filter(t=>t.dayIndex===d).sort((a,b)=> (a.start<b.start? -1:1));
    let prev: Task | null = null;
    for (const cur of arr) {
      if (prev) {
        const pe = prev.end; const cs = cur.start;
        if (cs < pe) { conflicts.add(prev.id); conflicts.add(cur.id); }
      }
      prev = cur;
    }
  }

  for (const t of tasks) {
    const x = yAxisW + t.dayIndex*colW + 8; // padding
    const y1 = yFor(t.start);
    const y2 = yFor(t.end);
    const h = Math.max(20, y2 - y1);
    const w = colW - 16;

    const isConflict = conflicts.has(t.id);
    if (t.done) { ctx.fillStyle = colors.green; ctx.strokeStyle = colors.greenBorder; }
    else if (isConflict) { ctx.fillStyle = colors.red; ctx.strokeStyle = colors.redBorder; }
    else { ctx.fillStyle = colors.blueFill; ctx.strokeStyle = colors.blue; }

    ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, y1, w, h, 6); ctx.fill(); ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colors.fg; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const title = t.title + (t.done ? ' (已完成)' : '');
    ctx.fillText(title, x+8, y1+6, w-16);
    ctx.fillStyle = 'rgba(107,114,128,0.9)';
    ctx.fillText(`${t.start} - ${t.end}`, x+8, y1+22, w-16);
    ctx.restore();
  }
}

export default function ExportMenu({ days, tasks }: { days: number; tasks: Task[] }) {
  const filename = useMemo(() => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    return `planner_${stamp}.png`;
  }, []);

  return (
    <button
      className="rounded px-3 py-1 text-sm border"
      onClick={async () => {
        const canvas = document.createElement('canvas');
        drawPlannerCanvas(canvas, days, tasks, { scale: 2 });
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
      }}
    >导出 PNG</button>
  );
}

