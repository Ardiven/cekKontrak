import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-body-sm text-xs sm:text-sm border border-slate-700 animate-bounce">
      <span className="material-symbols-outlined text-teal-400 text-[20px]">check_circle</span>
      <span>{message}</span>
    </div>
  );
}
