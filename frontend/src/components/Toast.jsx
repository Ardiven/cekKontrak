import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded shadow-lg text-sm flex items-center gap-2 border border-slate-800 transition-opacity"
    >
      <span className="material-symbols-outlined text-[18px] text-emerald-400">check</span>
      <span>{message}</span>
    </div>
  );
}
