'use client';
import { createContext, useContext, useMemo, useState } from 'react';

type ToastItem = { id: number; text: string };
const ToastCtx = createContext<{ show: (text: string) => void } | null>(null);
export function useToast() { const c = useContext(ToastCtx); if (!c) throw new Error('ToastProvider required'); return c; }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const api = useMemo(() => ({
    show(text: string) {
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { id, text }]);
      setTimeout(() => setItems((xs) => xs.filter((i) => i.id !== id)), 3000);
    },
  }), []);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[9999] space-y-2">
        {items.map((i) => (
          <div key={i.id} className="pointer-events-auto rounded border bg-white/95 px-3 py-2 text-sm shadow-md dark:border-zinc-700 dark:bg-zinc-900/95">
            {i.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
