import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div class="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-space-md py- space-sm py-3 rounded-xl shadow-2xl flex items-center gap-space-xs font-body-sm text-body-sm animate-bounce">
      <span class="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
      <span>{message}</span>
    </div>
  );
}
