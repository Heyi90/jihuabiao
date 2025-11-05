'use client';
import React from 'react';

export default function Dialog({ open, title, children, onClose }: { open: boolean; title?: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10000]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4 sm:pt-24">
        <div className="w-full max-w-lg rounded border bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">{title}</div>
            <button className="h-7 w-7 rounded border text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={onClose}>×</button>
          </div>
          <div className="max-h-[60vh] overflow-auto text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
