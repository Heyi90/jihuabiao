export function hoursRange(start=6, end=23) {
  const arr: string[] = [];
  for (let h=start; h<=end; h++) {
    arr.push(String(h).padStart(2,'0')+':00');
  }
  return arr;
}

export default function TimelineY() {
  const hours = hoursRange();
  return (
    <div className="sticky left-0 z-10 w-16 select-none bg-background pt-[40px]">
      {hours.map((h, i) => (
        <div key={h} className="relative h-12 text-xs text-zinc-500">
          <span className={`absolute right-1 ${i===0 ? 'top-0' : '-top-2'}`}>{h}</span>
        </div>
      ))}
    </div>
  );
}

